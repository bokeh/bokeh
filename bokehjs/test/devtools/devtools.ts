import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

import chalk from "chalk"
import yargs from "yargs"
import {Bar, Presets} from "cli-progress"

import {load_baselines} from "./baselines.js"
import {platform} from "./sys.js"
import type {Suite, TestRunContext, ScreenshotMode} from "./types.js"
import {Exit} from "./types.js"
import {descriptions, description, encode, show_tree} from "./format.js"
import {BrowserError, BrowserManager, Value, Failure} from "./browser.js"
import {TestDiscovery, type TestCase, type TestStatus} from "./discovery.js"
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
  host: {type: "string", default: "127.0.0.1"},
  port: {type: "number", default: 9222},
  ref: {type: "string", default: "HEAD"},
  randomize: {type: "boolean", default: false},
  seed: {type: "number", default: Date.now()},
  pedantic: {type: "boolean", default: false},
  keyword: {type: "string", array: true, demandOption: false, alias: "k"},
  grep: {type: "string", array: true, demandOption: false},
  "baselines-root": {type: "string", demandOption: false},
  screenshot: {type: "string", choices: ["test", "save", "skip"] as const, default: "test"},
  retry: {type: "boolean", default: false},
  info: {type: "boolean", default: false},
}).parseSync()

const {host, port, ref, randomize, seed, pedantic, keyword, grep, screenshot, retry, info} = argv as typeof argv & {screenshot: ScreenshotMode}
const url = argv._[0] as string | undefined ?? "about:blank"
const MAX_BROWSER_RESTARTS = 2

type RestartBrowserRequest = {
  type: "restart-browser"
  id: number
  reason: string
}

type RestartBrowserResponse = {
  type: "browser-restarted"
  id: number
  error?: string
}

let next_restart_id = 0

async function request_browser_restart(reason: string): Promise<void> {
  if (process.send == null) {
    throw new Error("browser restart is unavailable; run tests through 'node make'")
  }

  const id = next_restart_id++
  const request: RestartBrowserRequest = {type: "restart-browser", id, reason}

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error("timed out waiting for the replacement browser"))
    }, 60000)
    timer.unref()

    const on_message = (message: unknown) => {
      const response = message as Partial<RestartBrowserResponse>
      if (response.type != "browser-restarted" || response.id != id) {
        return
      }

      cleanup()
      if (response.error == null) {
        resolve()
      } else {
        reject(new Error(response.error))
      }
    }

    const on_disconnect = () => {
      cleanup()
      reject(new Error("test controller disconnected while replacing the browser"))
    }

    function cleanup(): void {
      clearTimeout(timer)
      process.off("message", on_message)
      process.off("disconnect", on_disconnect)
    }

    process.on("message", on_message)
    process.once("disconnect", on_disconnect)
    process.send!(request)
  })
}

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

function format_output(test_case: TestCase): string | null {
  const [suites, test, status] = test_case

  if ((status.failure ?? false) || (status.timeout ?? false)) {
    const output = show_tree(suites, test)

    for (const error of status.errors) {
      output.push(error)
    }

    return output.join("\n")
  } else {
    return null
  }
}

async function run_tests(ctx: TestRunContext): Promise<boolean> {
  const browser = new BrowserManager()
  const baselines_root = argv["baselines-root"] ?? null
  let failure = false
  try {
    if (baselines_root != null) {
      const report_dir = path.join(baselines_root, platform)
      await fs.promises.rm(path.join(report_dir, "report.json"), {force: true})
      await fs.promises.rm(path.join(report_dir, "report.out"), {force: true})
      for (const file of await fs.promises.readdir(report_dir)) {
        if (/^report\.json\.\d+\.tmp$/.test(file)) {
          await fs.promises.rm(path.join(report_dir, file), {force: true})
        }
      }
    }

    const initialize_browser = async () => {
      await browser.connect(port, host)
      await browser.initialize_page(url)
      await browser.evaluate("preload_fonts()")

      const ready = await browser.is_ready()
      if (!ready) {
        throw new Error(`failed to render ${url}`)
      }
    }

    const recover_browser = async (initial_error: unknown, test_name: string) => {
      let error = initial_error
      for (let attempt = 1; attempt <= MAX_BROWSER_RESTARTS + 1; attempt++) {
        const message = error instanceof Error ? error.message : `${error}`
        const reason = `${message} while running "${test_name}"`
        console.error(`Browser became unavailable ${reason}`)
        await browser.reset()
        try {
          await request_browser_restart(reason)
          await initialize_browser()
          return
        } catch (recovery_error) {
          error = recovery_error
          const recovery_message = recovery_error instanceof Error ? recovery_error.message : `${recovery_error}`
          console.error(`Browser recovery attempt ${attempt} failed: ${recovery_message}`)
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

      const result = await browser.evaluate<Suite>("Tests.top_level")
      if (!(result instanceof Value)) {
        const reason = result instanceof Failure ? result.text : "timeout"
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

      discovery.apply_filters(keyword, grep)

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

      const progress = new Bar({
        format: "{bar} {percentage}% | {value} of {total}{failed}{skipped} | {duration}s",
        stream: process.stdout,
        noTTYOutput: true,
        notTTYSchedule: 1000,
      }, Presets.shades_classic)

      let skipped = 0
      let failed = 0

      function state(): object {
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

      progress.start(selected_tests.length, 0, state())

      const metrics = baselines_root != null ? new MetricsCollector() : null
      const runner = new TestRunner(browser, ctx, baselines_root, screenshot, pedantic, top_level, ref, metrics)

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
          const output = format_output(test_case)
          if (output != null) {
            out_stream.write("\n")
            out_stream.write(output)
            out_stream.write("\n")
          }
        }
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

              if (browser_restarts++ < MAX_BROWSER_RESTARTS) {
                console.error(`Retrying "${test_name}" in a fresh browser`)
              } else {
                status.errors.push(`Browser remained unavailable after ${MAX_BROWSER_RESTARTS + 1} attempts: ${error.message}`)
                status.failure = true
                break
              }
            }
          }

          if (status.skipped ?? false) {
            skipped++
          }
          if ((status.failure ?? false) || (status.timeout ?? false)) {
            failed++
          }

          append_report_out(test_case)
          progress.increment(1, state())
        }
      } finally {
        progress.stop()
      }

      await finish_report_out()

      for (const test_case of selected_tests) {
        const output = format_output(test_case)
        if (output != null) {
          console.log("")
          console.log(output)
        }
      }

      if (baselines_root != null) {
        const selected_baseline_names = selected_tests.map(([,, status]) => status.baseline_name!)
        const results = selected_tests.map(([suites, test, status]) => {
          const {failure, baseline_name, baseline, existing_blf, image, image_diff, reference} = status
          return [descriptions(suites, test), {failure, baseline_name, baseline, existing_blf, image, image_diff, reference}]
        })
        const json = JSON.stringify({
          completed: true,
          reference: ref,
          baseline_names: selected_baseline_names,
          results,
          metrics: metrics?.get_metrics() ?? {},
        }, (_key, value) => {
          if (value?.type == "Buffer") {
            return Buffer.from(value.data).toString("base64")
          } else {
            return value
          }
        })
        const report_path = path.join(baselines_root, platform, "report.json")
        const temporary_report_path = `${report_path}.${process.pid}.tmp`
        await fs.promises.writeFile(temporary_report_path, json)
        await fs.promises.rename(temporary_report_path, report_path)

        const files = new Set(await fs.promises.readdir(path.join(baselines_root, platform)))
        files.delete("report.json")
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
      try {
        await browser.discard_console_entries()
      } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`
        console.error(`Unable to discard browser console entries during cleanup: ${message}`)
      }
    }
  } catch (error) {
    failure = true
    if (!(error instanceof Exit)) {
      const msg = error instanceof Error && error.stack != null ? error.stack : error
      console.error(`INTERNAL ERROR: ${msg}`)
    }
  } finally {
    await browser.reset()
  }

  return !failure
}

async function run(): Promise<void> {
  const {browser, protocol, major} = await BrowserManager.get_version(port, host)
  console.log(`Running in ${chalk.cyan(browser)} using devtools protocol ${chalk.cyan(protocol)}`)
  const ok = !info ? await run_tests({chromium_version: major}) : true
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
