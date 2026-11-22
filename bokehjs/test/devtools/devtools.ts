import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

import chalk from "chalk"
import yargs from "yargs"
import {Bar, Presets} from "cli-progress"

import {load_baselines} from "./baselines.js"
import {platform} from "./sys.js"
import type {Suite, TestRunContext, ScreenshotMode, FilterResult} from "./types.js"
import {Exit} from "./types.js"
import {descriptions, description, encode, show_tree, render_ansi} from "./format.js"
import {BrowserError, BrowserManager, Value, Failure} from "./browser.js"
import {TestDiscovery} from "./discovery.js"
import type {TestCase, TestStatus} from "./discovery.js"
import {MetricsCollector} from "./metrics.js"
import {TestRunner} from "./test-runner.js"

let rl: readline.Interface | undefined
if (process.platform == "win32") {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.on("SIGINT", () => {
    process.emit("SIGINT", "SIGINT")
  })
}

process.on("SIGINT", () => {
  console.log()
  process.exit(130)
})

process.on("exit", () => {
  rl?.close()
})

const argv = yargs(process.argv.slice(2)).options({
  executable: {type: "string", demandOption: true},
  ref: {type: "string", default: "HEAD"},
  randomize: {type: "boolean", default: false},
  seed: {type: "number", default: Date.now()},
  pedantic: {type: "boolean", default: false},
  keyword: {type: "string", array: true, demandOption: false, alias: "k"},
  grep: {type: "string", array: true, demandOption: false, alias: "g"},
  skip: {type: "string", array: true, demandOption: false},
  file: {type: "string", array: true, demandOption: false, alias: "f"},
  "baselines-root": {type: "string", demandOption: false},
  screenshot: {type: "string", choices: ["test", "save", "skip"] as const, default: "test"},
  "test-timeout": {type: "number", demandOption: false},
  retry: {type: "boolean", default: false},
  info: {type: "boolean", default: false},
}).parseSync()

const {executable, ref, randomize, seed, pedantic, keyword, grep, skip, file, screenshot, retry, info} = argv as typeof argv & {screenshot: ScreenshotMode}
const url = argv._[0] as string | undefined ?? "about:blank"
const MAX_BROWSER_RESTARTS = 2
const MAX_BROWSER_LAUNCH_ATTEMPTS = 3
const DEFAULT_TEST_TIMEOUT = 30
const MAX_TEST_TIMEOUT = 2_147_483 // Largest whole-second Node.js timer.

const configured_test_timeout = argv.testTimeout
if (configured_test_timeout != null &&
    (!Number.isSafeInteger(configured_test_timeout) || configured_test_timeout < 0 || configured_test_timeout > MAX_TEST_TIMEOUT)) {
  throw new Error(`--test-timeout must be a whole number of seconds between 0 and ${MAX_TEST_TIMEOUT}`)
}
const test_timeout_s = configured_test_timeout ?? DEFAULT_TEST_TIMEOUT
const test_timeout = test_timeout_s == 0 ? null : test_timeout_s*1000

function copy_status(status: TestStatus): TestStatus {
  return {...status, errors: [...status.errors]}
}

function restore_status(status: TestStatus, checkpoint: TestStatus): void {
  for (const key of Object.keys(status) as (keyof TestStatus)[]) {
    delete status[key]
  }
  Object.assign(status, copy_status(checkpoint))
}

type BaselineFilesCheckpoint = Map<string, Buffer | null>

async function read_optional(file: string): Promise<Buffer | null> {
  try {
    return await fs.promises.readFile(file)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code == "ENOENT") {
      return null
    }
    throw error
  }
}

async function checkpoint_baseline_files(baselines_root: string | null, baseline_name: string | undefined): Promise<BaselineFilesCheckpoint | null> {
  if (baselines_root == null || baseline_name == null) {
    return null
  }

  const checkpoint: BaselineFilesCheckpoint = new Map()
  const baseline_path = path.join(baselines_root, platform, baseline_name)
  for (const extension of [".blf", ".png"]) {
    const file = `${baseline_path}${extension}`
    checkpoint.set(file, await read_optional(file))
  }
  return checkpoint
}

async function restore_baseline_files(checkpoint: BaselineFilesCheckpoint | null): Promise<void> {
  if (checkpoint == null) {
    return
  }
  for (const [file, contents] of checkpoint) {
    if (contents == null) {
      await fs.promises.rm(file, {force: true})
    } else {
      await fs.promises.writeFile(file, contents)
    }
  }
}

function format_output(test_case: TestCase, color?: boolean): string | null {
  const [suites, test, status] = test_case

  if ((status.failure ?? false) || (status.timeout ?? false)) {
    const output = show_tree(suites, test)

    if (test.file != null) {
      output.push(render_ansi(`file: ${chalk.cyan(test.file)}`, color))
    }

    for (const error of status.errors) {
      output.push(render_ansi(error, color))
    }

    return output.join("\n")
  } else {
    return null
  }
}

type ProgressState = {failed: string, skipped: string}

interface Progress {
  start(state: ProgressState): void
  increment(state: ProgressState): void
  log(text: string): void
  stop(): void
}

/**
 * Shows an animated progress bar on a TTY. Otherwise (e.g. CI logs, piped
 * output, agents), prints a plain status line only every 10% or 30 seconds.
 */
function create_progress(total: number): Progress {
  if (process.stdout.isTTY) {
    const bar = new Bar({
      format: "{bar} {percentage}% | {value} of {total}{failed}{skipped} | {duration}s",
      stream: process.stdout,
      // By default line wrapping is disabled while the bar is active, which would
      // truncate failure details logged mid-run. Keep it enabled; the bar line is
      // trimmed to the terminal width by cli-progress instead.
      linewrap: true,
    }, Presets.shades_classic)

    return {
      start(state) {
        bar.start(total, 0, state)
      },
      increment(state) {
        bar.increment(1, state)
      },
      log(text) {
        // Clear the bar's line; it will be redrawn below the text on the next update. The bar
        // restores the cursor position saved at start when it stops, but that position refers
        // to a screen row, which becomes stale when text scrolls the screen, so save it again.
        process.stdout.write(`\r\x1b[K${text}\n\x1b7`)
      },
      stop() {
        bar.stop()
      },
    }
  } else {
    const step = Math.max(1, Math.ceil(total / 10))
    const interval = 30_000

    let value = 0
    let started = Date.now()
    let reported = started

    const report = (state: ProgressState) => {
      const now = Date.now()
      const percentage = total == 0 ? 100 : Math.floor(value / total * 100)
      const duration = Math.round((now - started) / 1000)
      console.log(`${percentage}% | ${value} of ${total}${state.failed}${state.skipped} | ${duration}s`)
      reported = now
    }

    return {
      start() {
        started = Date.now()
        reported = started
      },
      increment(state) {
        value++
        if (value == total || value % step == 0 || Date.now() - reported >= interval) {
          report(state)
        }
      },
      log(text) {
        console.log(text)
      },
      stop() {},
    }
  }
}

async function run_tests(browser: BrowserManager, ctx: TestRunContext): Promise<boolean> {
  const baselines_root = argv["baselines-root"] ?? null
  let failure = false
  try {
    if (baselines_root != null) {
      const report_dir = path.join(baselines_root, platform)
      await fs.promises.rm(path.join(report_dir, "report.jsonl"), {force: true})
      await fs.promises.rm(path.join(report_dir, "report.out"), {force: true})
      // Remove reports written by older runners.
      await fs.promises.rm(path.join(report_dir, "report.json"), {force: true})
      for (const file of await fs.promises.readdir(report_dir)) {
        if (/^report\.json\.\d+\.tmp$/.test(file)) {
          await fs.promises.rm(path.join(report_dir, file), {force: true})
        }
      }
    }

    const initialize_browser = async () => {
      await browser.initialize_page(url)
      await browser.evaluate("preload_fonts()")

      const ready = await browser.is_ready()
      if (!ready) {
        throw new Error(`failed to render ${url}`)
      }
    }

    // Messages logged while tests are running must go through the progress bar.
    let log_message = (text: string) => console.error(text)

    const recover_browser = async (initial_error: unknown, test_name: string) => {
      let error = initial_error
      for (let attempt = 1; attempt <= MAX_BROWSER_LAUNCH_ATTEMPTS; attempt++) {
        const message = error instanceof Error ? error.message : `${error}`
        const reason = `${message} while running "${test_name}"`
        log_message(`Browser became unavailable ${reason}`)
        await browser.reset()
        try {
          await browser.launch()
          await initialize_browser()
          return
        } catch (recovery_error) {
          error = recovery_error
          const recovery_message = recovery_error instanceof Error ? recovery_error.message : `${recovery_error}`
          log_message(`Browser recovery attempt ${attempt} failed: ${recovery_message}`)
        }
      }
      const message = error instanceof Error ? error.message : `${error}`
      throw new BrowserError("Browser.recover", message)
    }

    await initialize_browser()

    try {
      function fail(msg: string, code: number = 1): never {
        console.log(msg)
        throw new Exit(code)
      }

      const filters = {keyword, grep, file}
      const filter_result = await browser.evaluate<FilterResult>(`Tests.apply_filters(${JSON.stringify(filters)})`)
      if (!(filter_result instanceof Value)) {
        const reason = filter_result instanceof Failure ? filter_result.text : "timeout"
        fail(`internal error: failed to apply test filters: ${reason}`)
      }
      for (const warning of filter_result.value.warnings) {
        console.log(`${chalk.yellow("warning")}: ${warning}`)
      }
      if (filter_result.value.errors.length != 0) {
        fail(filter_result.value.errors.map((error) => `${chalk.red("error")}: ${error}`).join("\n"))
      }

      const result = await browser.evaluate<Suite>("Tests.top_level")
      if (!(result instanceof Value)) {
        const reason = result instanceof Failure ? result.text : "timeout"
        for (const entry of browser.get_entries()) {
          console.error(`page ${entry.level}: ${entry.text}`)
        }
        for (const exception of browser.get_exceptions()) {
          console.error(`page exception: ${exception.text}`)
        }
        fail(`internal error: failed to collect tests: ${reason}`)
      }

      const top_level = result.value

      const discovery = new TestDiscovery()
      discovery.collect_tests(top_level)

      if (randomize) {
        discovery.randomize(seed)
      }

      const desc_errors = discovery.validate_descriptions()
      if (desc_errors.length > 0) {
        for (const error of desc_errors) {
          console.log(error)
        }
        fail("one or more test descriptions use invalid characters")
      }

      discovery.apply_filters(skip)

      const all_tests = discovery.get_all_tests()
      const selected_tests = discovery.get_selected_tests()
      const {all: num_all_tests, selected: num_selected_tests} = discovery.get_counts()

      if (num_selected_tests == 0) {
        fail("nothing to test")
      }

      const baseline_names = new Set<string>()

      for (const test_case of all_tests) {
        const [suites, test, status] = test_case

        const baseline_name = encode(description(suites, test, "__"))
        status.baseline_name = baseline_name

        if (baseline_names.has(baseline_name)) {
          status.errors.push("duplicated description")
          status.failure = true
        } else {
          baseline_names.add(baseline_name)
        }
      }

      if (baselines_root != null) {
        const baseline_paths = selected_tests.map(([,, status]) =>
          path.join(baselines_root, platform, status.baseline_name!),
        )

        const baselines = await load_baselines(baseline_paths, ref)

        for (let i = 0; i < baselines.length; i++) {
          const [,, status] = selected_tests[i]
          const baseline = baselines[i]
          if (baseline.blf != null) {
            status.existing_blf = baseline.blf
          }
          if (baseline.png != null) {
            status.existing_png = baseline.png
          }
        }
      }

      const progress = create_progress(selected_tests.length)

      let skipped = 0
      let failed = 0

      function state(): ProgressState {
        function format(value: number, single: string, plural?: string): string {
          if (value == 0) {
            return ""
          } else if (value == 1) {
            return ` | 1 ${single}`
          } else {
            return ` | ${value} ${plural ?? single}`
          }
        }
        return {
          failed: format(failed, "failed"),
          skipped: format(skipped, "skipped"),
        }
      }

      progress.start(state())
      log_message = (text) => progress.log(text)

      const metrics = baselines_root != null ? new MetricsCollector() : null
      const runner = new TestRunner(browser, ctx, baselines_root, screenshot, pedantic, top_level, ref, metrics, test_timeout)

      if (metrics != null) {
        await metrics.add_datapoint(browser)
      }

      const out_stream = (() => {
        if (baselines_root != null) {
          const report_out = path.join(baselines_root, platform, "report.out")
          const stream = fs.createWriteStream(report_out, {flags: "w"})
          stream.write(`Tests report output generated on ${new Date().toISOString()}:\n`)
          return stream
        } else {
          return null
        }
      })()

      const finish_report_out = async () => {
        if (out_stream != null) {
          await new Promise<void>((resolve, reject) => {
            out_stream.once("error", reject)
            out_stream.end(`\nTests finished on ${new Date().toISOString()} with ${failed} failures.\n`, resolve)
          })
        }
      }

      function append_report_out(test_case: TestCase): void {
        if (out_stream != null) {
          const output = format_output(test_case, false)
          if (output != null) {
            out_stream.write("\n")
            out_stream.write(output)
            out_stream.write("\n")
          }
        }
      }

      /**
       * `report.jsonl` is written incrementally as JSON Lines, so that it can be reviewed while
       * tests are still running. It consists of a `start` record, a `result` record per finished
       * test and an `end` record, whose absence indicates a running or an interrupted run.
       */
      const json_stream = (() => {
        if (baselines_root != null) {
          const report_path = path.join(baselines_root, platform, "report.jsonl")
          return fs.createWriteStream(report_path, {flags: "w"})
        } else {
          return null
        }
      })()

      function append_report_json(record: object): void {
        if (json_stream != null) {
          const json = JSON.stringify(record, (_key, value) => {
            if (value?.type == "Buffer") {
              return Buffer.from(value.data).toString("base64")
            } else {
              return value
            }
          })
          json_stream.write(`${json}\n`)
        }
      }

      const finish_report_json = async () => {
        if (json_stream != null) {
          append_report_json({type: "end", metrics: metrics?.get_metrics() ?? {}})
          await new Promise<void>((resolve, reject) => {
            json_stream.once("error", reject)
            json_stream.end(resolve)
          })
        }
      }

      append_report_json({
        type: "start",
        reference: ref,
        baseline_names: selected_tests.map(([,, status]) => status.baseline_name!),
        selected: selected_tests.length,
      })

      function append_report_result([suites, test, status]: TestCase): void {
        const {failure, timeout, skipped, baseline_name, baseline, existing_blf, image, image_diff, reference} = status
        const success = !(failure ?? false) && !(timeout ?? false) && !(skipped ?? false)
        const {file} = test
        append_report_json({
          type: "result",
          descriptions: descriptions(suites, test),
          status: {success, failure, timeout, skipped, file, baseline_name, baseline, existing_blf, image, image_diff, reference},
        })
      }

      try {
        let browser_ready = true
        let browser_error: unknown = null
        for (const test_case of selected_tests) {
          const [suites, test, status] = test_case
          const test_name = description(suites, test)
          const status_checkpoint = copy_status(status)
          const metrics_checkpoint = metrics?.checkpoint()
          const files_checkpoint = await checkpoint_baseline_files(baselines_root, status.baseline_name)
          let browser_restarts = 0

          if (!browser_ready) {
            try {
              await recover_browser(browser_error, test_name)
              browser_ready = true
              browser_error = null
            } catch (error) {
              browser_error = error
              const message = error instanceof Error ? error.message : `${error}`
              status.errors.push(`Unable to recover the browser before this test: ${message}`)
              status.failure = true
            }
          }

          while (true) {
            if (!browser_ready) {
              break
            }
            try {
              await runner.run_with_retry(test_case, retry)
              break
            } catch (error) {
              if (!(error instanceof BrowserError)) {
                throw error
              }

              restore_status(status, status_checkpoint)
              await restore_baseline_files(files_checkpoint)
              if (metrics_checkpoint != null) {
                metrics!.restore(metrics_checkpoint)
              }

              browser_ready = false
              browser_error = error
              if (browser_restarts >= MAX_BROWSER_RESTARTS) {
                status.errors.push(`Browser failed during this test after ${MAX_BROWSER_RESTARTS + 1} attempts: ${error.message}`)
                status.failure = true
                break
              }

              try {
                await recover_browser(error, test_name)
                browser_ready = true
                browser_error = null
              } catch (recovery_error) {
                browser_error = recovery_error
                const message = recovery_error instanceof Error ? recovery_error.message : `${recovery_error}`
                status.errors.push(`Unable to recover the browser: ${message}`)
                status.failure = true
                break
              }

              browser_restarts++
              log_message(`Retrying "${test_name}" in a fresh browser`)
            }
          }

          if (status.skipped ?? false) {
            skipped++
          }
          if ((status.failure ?? false) || (status.timeout ?? false)) {
            failed++
          }

          append_report_out(test_case)
          append_report_result(test_case)

          // Report failures as they happen, so that they aren't lost if the run is interrupted.
          const output = format_output(test_case)
          if (output != null) {
            progress.log(`\n${output}\n`)
          }

          progress.increment(state())
        }
      } finally {
        progress.stop()
        log_message = (text) => console.error(text)
      }

      await finish_report_out()

      const failed_tests = selected_tests.filter(([,, status]) => (status.failure ?? false) || (status.timeout ?? false))
      if (failed_tests.length != 0) {
        console.log("")
        console.log("Failed tests:")
        for (const [suites, test, status] of failed_tests) {
          const reason = (status.timeout ?? false) ? " (timeout)" : ""
          console.log(`  ${chalk.red(description(suites, test))}${reason}`)
        }
      }

      await finish_report_json()

      if (baselines_root != null) {
        const files = new Set(await fs.promises.readdir(path.join(baselines_root, platform)))
        files.delete("report.jsonl")
        files.delete("report.out")

        for (const name of baseline_names) {
          files.delete(`${name}.blf`)
          files.delete(`${name}.png`)
        }

        if (files.size != 0) {
          fail(`there are outdated baselines:\n${[...files].join("\n")}`)
        }
      }

      const passed = num_selected_tests - failed - skipped
      const deselected = num_all_tests - num_selected_tests
      const parts = {
        failed: chalk.red(`${failed} failed`),
        passed: chalk.green(`${passed} passed`),
        skipped: chalk.yellow(`${skipped} skipped`),
        deselected: chalk.magenta(`${deselected} deselected`),
      }
      const successful = `${parts.passed}, ${parts.skipped}, ${parts.deselected} of total ${num_all_tests} tests`
      if (failed != 0) {
        fail(`\n${parts.failed}, ${successful}`)
      } else {
        console.log(successful)
      }
    } finally {
      browser.clear_entries()
    }
  } catch (error) {
    failure = true
    if (!(error instanceof Exit)) {
      const msg = error instanceof Error && error.stack != null ? error.stack : error
      console.error(`INTERNAL ERROR: ${msg}`)
    }
  }

  return !failure
}

async function run(): Promise<void> {
  const browser = new BrowserManager(executable)
  let ok = false
  try {
    await browser.launch()
    const {browser: browser_name, major} = browser.get_version()
    console.log(`Running in ${chalk.cyan(browser_name)} using ${chalk.cyan("Playwright")}`)
    console.log(`Default test timeout: ${test_timeout == null ? "disabled" : `${test_timeout_s} s`}`)
    ok = !info ? await run_tests(browser, {chromium_version: major}) : true
  } finally {
    await browser.reset()
  }
  process.exit(ok ? 0 : 1)
}

async function main(): Promise<void> {
  try {
    await run()
  } catch (e) {
    console.log(`CRITICAL ERROR: ${e}`)
    process.exit(1)
  }
}

void main()
