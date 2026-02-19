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
import {BrowserManager, Value, Failure} from "./browser.js"
import {TestDiscovery, type TestCase} from "./discovery.js"
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
const is_cross_backend = (() => {
  try {
    return new URL(url).pathname.replace(/^\//, "") == "cross_backend"
  } catch {
    return false
  }
})()

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
  let failure = false
  try {
    await browser.connect(port, host)

    try {
      function fail(msg: string, code: number = 1): never {
        console.log(msg)
        throw new Exit(code)
      }

      await browser.initialize_page(url)
      await browser.evaluate("preload_fonts()")

      const ready = await browser.is_ready()
      if (!ready) {
        fail(`failed to render ${url}`)
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

      const baselines_root = argv["baselines-root"] ?? null
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
      const runner = new TestRunner(browser, ctx, baselines_root, screenshot, pedantic, top_level, ref, metrics, is_cross_backend)

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
        for (const test_case of selected_tests) {
          const [,, status] = test_case

          await runner.run_with_retry(test_case, retry)

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

      if (out_stream != null) {
        out_stream.write("\n")
        out_stream.write(`Tests finished on ${new Date().toISOString()} with ${failed} failures.\n`)
        out_stream.end()
      }

      for (const test_case of selected_tests) {
        const output = format_output(test_case)
        if (output != null) {
          console.log("")
          console.log(output)
        }
      }

      if (baselines_root != null) {
        const results = selected_tests.map(([suites, test, status]) => {
          const {failure, image, image_diff, reference} = status
          return [descriptions(suites, test), {failure, image, image_diff, reference}]
        })
        const json = JSON.stringify({results, metrics: metrics?.get_metrics() ?? {}}, (_key, value) => {
          if (value?.type == "Buffer") {
            return Buffer.from(value.data).toString("base64")
          } else {
            return value
          }
        })
        await fs.promises.writeFile(path.join(baselines_root, platform, "report.json"), json)

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

      if (is_cross_backend) {
        const results_dir = path.join("test", "cross_backend", "results", platform)
        await fs.promises.mkdir(results_dir, {recursive: true})
        const report = {
          generated_at: new Date().toISOString(),
          platform,
          total: runner.cross_results.length,
          passed: runner.cross_results.filter(({passed}) => passed).length,
          failed: runner.cross_results.filter(({passed}) => !passed).length,
          results: runner.cross_results,
        }
        await fs.promises.writeFile(path.join(results_dir, "report.json"), JSON.stringify(report, null, 2))
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
      await browser.discard_console_entries()
    }
  } catch (error) {
    failure = true
    if (!(error instanceof Exit)) {
      const msg = error instanceof Error && error.stack != null ? error.stack : error
      console.error(`INTERNAL ERROR: ${msg}`)
    }
  } finally {
    await browser.close()
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
