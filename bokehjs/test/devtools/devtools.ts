import type {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import fs from "fs"
import path from "path"
import readline from "readline"
import chalk from "chalk"
import yargs from "yargs"
import {Bar, Presets} from "cli-progress"

import type {Box, State} from "./baselines"
import {create_baseline, diff_baseline, load_baselines} from "./baselines"
import {diff_image} from "./image"
import {platform} from "./sys"

const MAX_INT32 = 2147483647
export class Random {
  private seed: number

  constructor(seed: number) {
    this.seed = seed % MAX_INT32
    if (this.seed <= 0) {
      this.seed += MAX_INT32 - 1
    }
  }

  integer(): number {
    this.seed = (48271*this.seed) % MAX_INT32
    return this.seed
  }

  float(): number {
    return (this.integer() - 1) / (MAX_INT32 - 1)
  }
}

function shuffle<T>(array: T[], random: Random): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random.float()*(i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

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

const {host, port, ref, randomize, seed, pedantic, keyword, grep, screenshot, retry, info} = argv
const url = argv._[0] as string | undefined ?? "about:blank"

interface CallFrame {
  name: string
  url: string
  line: number
  col: number
}

interface Err {
  text: string
  url: string
  line: number
  col: number
  trace: CallFrame[]
}

class Exit extends Error {
  constructor(public code: number) {
    super(`exit: ${code}`)
  }
}

class TimeoutError extends Error {
  constructor() {
    super("timeout")
  }
}

function timeout(ms: number): Promise<void> {
  return new Promise((_resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms)
    timer.unref()
  })
}

function encode(s: string): string {
  return s.replace(/[ \/\[\]:]/g, "_")
}

type Suite = {description: string, suites: Suite[], tests: Test[]}
type Test = {description: string, skip: boolean, omit?: boolean, threshold?: number, retries?: number, dpr?: number, no_image?: boolean}

type Result = {error: {str: string, stack?: string} | null, time: number, state?: State, bbox?: Box}

type TestRunContext = {
  chromium_version: number
}

async function run_tests(ctx: TestRunContext): Promise<boolean> {
  let client
  let failure = false
  try {
    client = await CDP({port, host})
    const {Emulation, Network, Browser, Page, DOM, Runtime, Log, Performance} = client
    try {
      function collect_trace(stackTrace: Protocol.Runtime.StackTrace): CallFrame[] {
        return stackTrace.callFrames.map(({functionName, url, lineNumber, columnNumber}) => {
          return {name: functionName != "" ? functionName : "(anonymous)", url, line: lineNumber+1, col: columnNumber+1}
        })
      }

      function handle_exception(exceptionDetails: Protocol.Runtime.ExceptionDetails): Err {
        const {text, exception, url, lineNumber, columnNumber, stackTrace} = exceptionDetails
        return {
          text: exception != null && exception.description != null ? exception.description : text,
          url: url ?? "(inline)",
          line: lineNumber+1,
          col: columnNumber+1,
          trace: stackTrace != null ? collect_trace(stackTrace) : [],
        }
      }

      type LogEntry = {level: "warning" | "error", text: string}

      let entries: LogEntry[] = []
      let exceptions: Err[] = []

      Runtime.consoleAPICalled(({type, args}) => {
        if (type == "warning" || type == "error") {
          const text = args.map(({value}) => value ? value.toString() : "").join(" ")
          entries.push({level: type, text})
        }
      })

      Log.entryAdded(({entry}) => {
        const {level, text} = entry
        if (level == "warning" || level == "error") {
          entries.push({level, text})
        }
      })

      Runtime.exceptionThrown(({exceptionDetails}) => {
        exceptions.push(handle_exception(exceptionDetails))
      })

      function fail(msg: string, code: number = 1): never {
        console.log(msg)
        throw new Exit(code)
      }

      // type Nominal<T, Name> = T & {[Symbol.species]: Name}

      class Value<T> {
        constructor(public value: T) {}
      }
      class Failure {
        constructor(public text: string) {}
      }
      class Timeout {}

      async function with_timeout<T>(promise: Promise<T>, wait: number): Promise<T | Timeout> {
        try {
          return await Promise.race([promise, timeout(wait)]) as T
        } catch (err) {
          if (err instanceof TimeoutError) {
            return new Timeout()
          } else {
            throw err
          }
        }
      }

      async function evaluate<T>(expression: string, timeout: number = 10000): Promise<Value<T> | Failure | Timeout> {
        const output = await with_timeout(Runtime.evaluate({expression, returnByValue: true, awaitPromise: true}), timeout)
        if (output instanceof Timeout) {
          return output
        } else {
          const {result, exceptionDetails} = output
          if (exceptionDetails == null) {
            return new Value(result.value)
          } else {
            const {text} = handle_exception(exceptionDetails)
            return new Failure(text)
          }
        }
      }

      async function is_ready(): Promise<boolean> {
        const expr = "typeof Bokeh !== 'undefined'"
        const result = await evaluate<boolean>(expr)
        return result instanceof Value && result.value
      }

      await Network.enable()
      await Network.setCacheDisabled({cacheDisabled: true})

      await Page.enable()
      await Page.navigate({url: "about:blank"})

      await DOM.enable({})

      await Runtime.enable()
      await Log.enable()
      await Performance.enable({timeDomain: "timeTicks"})

      async function override_metrics(dpr: number = 1): Promise<void> {
        await Emulation.setDeviceMetricsOverride({
          width: 2000,
          height: 4000,
          deviceScaleFactor: dpr,
          mobile: false,
        })
      }

      await override_metrics()
      await Emulation.setFocusEmulationEnabled({enabled: true})

      await Browser.grantPermissions({
        permissions: ["clipboardReadWrite"],
      })

      const {errorText} = await Page.navigate({url})

      if (errorText != null) {
        fail(errorText)
      }

      if (exceptions.length != 0) {
        for (const exc of exceptions) {
          console.log(exc.text)
        }

        fail(`failed to load ${url}`)
      }

      await Page.loadEventFired()
      await evaluate("preload_fonts()")

      const ready = await is_ready()
      if (!ready) {
        fail(`failed to render ${url}`)
      }

      const result = await evaluate<Suite>("Tests.top_level")
      if (!(result instanceof Value)) {
        // TODO: Failure.text
        const reason = result instanceof Failure ? result.text : "timeout"
        fail(`internal error: failed to collect tests: ${reason}`)
      }

      const top_level = result.value

      type Status = {
        success?: boolean
        failure?: boolean
        timeout?: boolean
        skipped?: boolean
        errors: string[]
        baseline_name?: string
        baseline?: string
        baseline_diff?: string
        reference?: Buffer
        image?: Buffer
        image_diff?: Buffer
        existing_blf?: string
        existing_png?: Buffer
      }

      type TestCase = [Suite[], Test, Status]

      function* iter({suites, tests}: Suite, parents: Suite[] = []): Iterable<TestCase> {
        for (const suite of suites) {
          yield* iter(suite, parents.concat(suite))
        }

        for (const test of tests) {
          yield [parents, test, {errors: []}]
        }
      }

      function descriptions(suites: Suite[], test: Test): string[] {
        return [...suites, test].map((obj) => obj.description)
      }

      function description(suites: Suite[], test: Test, sep: string = " "): string {
        return descriptions(suites, test).join(sep)
      }

      const all_tests = [...iter(top_level)]

      if (randomize) {
        const random = new Random(seed)
        console.log(`randomizing with seed ${seed}`)
        shuffle(all_tests, random)
      }

      if (keyword != null || grep != null) {
        if (keyword != null) {
          const keywords = keyword
          for (const [suites, test] of all_tests) {
            if (!keywords.some((keyword) => description(suites, test).includes(keyword))) {
              test.omit = true
            }
          }
        }

        if (grep != null) {
          const regexes = grep.map((re) => new RegExp(re))
          for (const [suites, test] of all_tests) {
            if (!regexes.some((regex) => description(suites, test).match(regex) != null)) {
              test.omit = true
            }
          }
        }
      }

      const selected_tests = all_tests.filter(([, test]) => test.omit !== true)

      const num_all_tests = all_tests.length
      const num_selected_tests = selected_tests.length

      if (num_selected_tests == 0) {
        fail("nothing to test")
      }

      const baselines_root = argv["baselines-root"]
      const baseline_names = new Set<string>()

      if (baselines_root != null) {
        const baseline_paths = []

        for (const test_case of selected_tests) {
          const [suites, test, _status] = test_case
          const baseline_name = encode(description(suites, test, "__"))
          const baseline_path = path.join(baselines_root, platform, baseline_name)
          baseline_paths.push(baseline_path)
        }

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

      function to_seq(suites: Suite[], test: Test): [number[], number] {
        let current = top_level
        const si = []
        for (const suite of suites) {
          si.push(current.suites.indexOf(suite))
          current = suite
        }
        const ti = current.tests.indexOf(test)
        return [si, ti]
      }

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

      type MetricKeys = "JSEventListeners" | "Nodes" | "Resources" | "LayoutCount" | "RecalcStyleCount" | "JSHeapUsedSize" | "JSHeapTotalSize"
      const metrics: {[key in MetricKeys]: number[]} = {
        JSEventListeners: [],
        Nodes: [],
        Resources: [],
        LayoutCount: [],
        RecalcStyleCount: [],
        JSHeapUsedSize: [],
        JSHeapTotalSize: [],
      }

      async function add_datapoint(): Promise<void> {
        if (baselines_root == null) {
          return
        }
        const data = await Performance.getMetrics()
        for (const {name, value} of data.metrics) {
          switch (name) {
            case "JSEventListeners":
            case "Nodes":
            case "Resources":
            case "LayoutCount":
            case "RecalcStyleCount":
            case "JSHeapUsedSize":
            case "JSHeapTotalSize":
              metrics[name].push(value)
          }
        }
      }

      await add_datapoint()

      const out_stream = await (async () => {
        if (baselines_root != null) {
          const report_out = path.join(baselines_root, platform, "report.out")
          await fs.promises.writeFile(report_out, "")

          const stream = fs.createWriteStream(report_out, {flags: "a"})
          stream.write(`Tests report output generated on ${new Date().toISOString()}:\n`)
          return stream
        } else {
          return null
        }
      })()

      function format_output(test_case: TestCase): string | null {
        const [suites, test, status] = test_case

        if ((status.failure ?? false) || (status.timeout ?? false)) {
          const output = []

          let depth = 0
          for (const suite of [...suites, test]) {
            const is_last = depth == suites.length
            const prefix = depth == 0 ? chalk.red("\u2717") : `${" ".repeat(depth)}\u2514${is_last ? "\u2500" : "\u252c"}\u2500`
            output.push(`${prefix} ${suite.description}`)
            depth++
          }

          for (const error of status.errors) {
            output.push(error)
          }

          return output.join("\n")
        } else {
          return null
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

      try {
        for (const test_case of selected_tests) {
          const [suites, test, status] = test_case

          entries = []
          exceptions = []

          const baseline_name = status.baseline_name!

          if (test.skip) {
            status.skipped = true
          } else {
            async function run_test(attempt: number | null, status: Status): Promise<boolean> {
              let may_retry = false
              const seq = JSON.stringify(to_seq(suites, test))
              const ctx_ = JSON.stringify(ctx)
              const output = await (async () => {
                if (test.dpr != null) {
                  await override_metrics(test.dpr)
                }
                try {
                  return await evaluate<Result>(`Tests.run(${seq}, ${ctx_})`)
                } finally {
                  if (test.dpr != null) {
                    await override_metrics()
                  }
                }
              })()
              await add_datapoint()
              try {
                const errors = entries.filter((entry) => entry.level == "error")
                if (errors.length != 0) {
                  status.errors.push(...errors.map((entry) => entry.text))
                  // status.failure = true // XXX: too chatty right now
                }

                if (exceptions.length != 0) {
                  status.errors.push(...exceptions.map((exc) => exc.text))
                  status.failure = true // XXX: too chatty right now
                }

                if (output instanceof Failure) {
                  status.errors.push(output.text)
                  status.failure = true
                } else if (output instanceof Timeout) {
                  status.errors.push("timeout")
                  status.timeout = true
                } else {
                  const result = output.value

                  if (result.error != null) {
                    const {str, stack} = result.error
                    status.errors.push(stack ?? str)
                    status.failure = true
                  }

                  if (baselines_root != null) {
                    const baseline_path = path.join(baselines_root, platform, baseline_name)

                    const {state: state_early} = result
                    if (state_early == null) {
                      status.errors.push("state not present in output")
                      status.failure = true
                    } else {
                      const output = await evaluate<State | null>(`Tests.get_state(${seq})`)
                      if (!(output instanceof Value) || output.value == null) {
                        status.errors.push("state not present in output")
                        status.failure = true
                      } else {
                        const state = output.value

                        await (async () => {
                          const baseline_early = create_baseline([state_early])
                          const baseline = create_baseline([state])

                          if (pedantic) {
                            // This shouldn't happen, but sometimes does, especially in
                            // interactive tests. This needs to be resolved earlier, but
                            // at least the state will be consistent with images.
                            if (baseline_early != baseline) {
                              status.errors.push("inconsistent state")
                              status.errors.push("early:", baseline_early)
                              status.errors.push("later:", baseline)
                              status.failure = true
                              return
                            }
                          }

                          const baseline_file = `${baseline_path}.blf`
                          await fs.promises.writeFile(baseline_file, baseline)
                          status.baseline = baseline

                          const {existing_blf} = status
                          if (existing_blf != baseline) {
                            if (existing_blf == null) {
                              status.errors.push("missing baseline")
                            } else {
                              if (test.retries != null) {
                                may_retry = true
                              }
                            }
                            const diff = diff_baseline(baseline_file, ref)
                            status.failure = true
                            status.baseline_diff = diff
                            status.errors.push(diff)
                          }
                        })()
                      }
                    }

                    if (!(test.no_image ?? false)) {
                      await (async () => {
                        const {bbox} = result
                        if (bbox != null) {
                          const image = await Page.captureScreenshot({format: "png", clip: {...bbox, scale: 1}})
                          const current = Buffer.from(image.data, "base64")
                          status.image = current

                          const image_file = `${baseline_path}.png`
                          const write_image = async () => fs.promises.writeFile(image_file, current)
                          const {existing_png} = status

                          switch (screenshot) {
                            case "test": {
                              if (existing_png == null) {
                                status.failure = true
                                status.errors.push("missing baseline image")
                                await write_image()
                              } else {
                                status.reference = existing_png

                                if (!existing_png.equals(current)) {
                                  const diff_result = diff_image(existing_png, current)
                                  if (diff_result != null) {
                                    may_retry = true
                                    const {diff, pixels, percent} = diff_result
                                    const threshold = test.threshold ?? 0
                                    if (pixels > threshold) {
                                      await write_image()
                                      status.failure = true
                                      status.image_diff = diff
                                      status.errors.push(`images differ by ${pixels}px (${percent.toFixed(2)}%)${attempt != null ? ` (attempt=${attempt})` : ""}`)
                                    }
                                  }
                                }
                              }
                              break
                            }
                            case "save": {
                              await write_image()
                              break
                            }
                            case "skip": {
                              break
                            }
                            default: {
                              throw new Error(`invalid argument --screenshot=${screenshot}`)
                            }
                          }
                        }
                      })()
                    }
                  }
                }
              } finally {
                const output = await evaluate(`Tests.clear(${seq})`)
                if (output instanceof Failure) {
                  status.errors.push(output.text)
                  status.failure = true
                }
              }

              return may_retry
            }

            const do_retry = await run_test(null, status)
            if ((retry || test.retries != null) && do_retry) {
              const retries = test.retries ?? 10

              for (let i = 0; i < retries; i++) {
                const do_retry = await run_test(i, status)
                if (!do_retry) {
                  break
                }
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
        const json = JSON.stringify({results, metrics}, (_key, value) => {
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
      await Runtime.discardConsoleEntries()
    }
  } catch (error) {
    failure = true
    if (!(error instanceof Exit)) {
      const msg = error instanceof Error && error.stack != null ? error.stack : error
      console.error(`INTERNAL ERROR: ${msg}`)
    }
  } finally {
    if (client != null) {
      await client.close()
    }
  }

  return !failure
}

async function get_version(): Promise<{browser: string, protocol: string}> {
  const version = await CDP.Version({port})
  return {
    browser: version.Browser,
    protocol: version["Protocol-Version"],
  }
}

type Version = [number, number, number, number]
const supported_chromium_version: Version = [118, 0, 5993, 88]

function get_version_tuple(version: string): Version | null {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/)
  if (match != null) {
    const [, a, b, c, d] = match.values()
    return [
      Number(a),
      Number(b),
      Number(c),
      Number(d),
    ]
  }
  return null
}

function check_version(current_chromium_version: Version | null): void {
  if (current_chromium_version == null) {
    const supported_str = supported_chromium_version.join(".")
    console.error(`${chalk.yellow("warning:")} unable to determine chromium version; officially supported version is ${supported_str}`)
    return
  }

  const [a, b, c, _d] = supported_chromium_version
  const [A, B, C, _D] = current_chromium_version

  if (a != A || b != B || c != C) {
    const supported_str = chalk.magenta(supported_chromium_version.join("."))
    const current_str = chalk.magenta(current_chromium_version.join("."))
    console.error(`${chalk.yellow("warning:")} ${current_str} is not supported; officially supported version is ${supported_str}`)
  }
}

async function run(): Promise<void> {
  const {browser, protocol} = await get_version()
  console.log(`Running in ${chalk.cyan(browser)} using devtools protocol ${chalk.cyan(protocol)}`)
  const version = get_version_tuple(browser)
  check_version(version)
  const major = version != null ? version[0] : 0
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
