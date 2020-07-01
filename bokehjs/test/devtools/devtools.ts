import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import fs = require("fs")
import path = require("path")
import {argv} from "yargs"
import chalk from "chalk"
import {Bar, Presets} from "cli-progress"

import {Box, State, create_baseline, load_baseline, diff_baseline, load_baseline_image} from "./baselines"
import {diff_image} from "./image"
import {platform} from "./sys"

const url = argv._[0]
const port = parseInt(argv.port as string | undefined ?? "9222")

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
  return s.replace(/[ \/]/g, "_")
}

type Suite = {description: string, suites: Suite[], tests: Test[]}
type Test = {description: string, skip: boolean, threshold?: number, dpr?: number}

type Result = {error: {str: string, stack?: string} | null, time: number, state?: State, bbox?: Box}

async function run_tests(): Promise<boolean> {
  let client
  let failure = false
  let exception = false
  let handle_exceptions = true
  try {
    client = await CDP({port})
    const {Emulation, Network, Page, Runtime, Log} = client
    try {
      function collect_trace(stackTrace: Protocol.Runtime.StackTrace): CallFrame[] {
        return stackTrace.callFrames.map(({functionName, url, lineNumber, columnNumber}) => {
          return {name: functionName || "(anonymous)", url, line: lineNumber+1, col: columnNumber+1}
        })
      }

      function handle_exception(exceptionDetails: Protocol.Runtime.ExceptionDetails): Err {
        const {text, exception, url, lineNumber, columnNumber, stackTrace} = exceptionDetails
        return {
          text: exception != null && exception.description != null ? exception.description : text,
          url: url || "(inline)",
          line: lineNumber+1,
          col: columnNumber+1,
          trace: stackTrace ? collect_trace(stackTrace) : [],
        }
      }

      type LogEntry = {level: "warning" | "error", text: string}

      let entries: LogEntry[] = []
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
        exception = true
        if (handle_exceptions)
          console.log(handle_exception(exceptionDetails).text)
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
          if (exceptionDetails == null)
            return new Value(result.value)
          else {
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

      await Runtime.enable()
      await Page.enable()
      await Log.enable()

      async function override_metrics(dpr: number = 1): Promise<void> {
        await Emulation.setDeviceMetricsOverride({
          width: 2000,
          height: 4000,
          deviceScaleFactor: dpr,
          mobile: false,
        })
      }

      override_metrics()

      const {errorText} = await Page.navigate({url})

      if (errorText != null) {
        fail(errorText)
      }

      if (exception) {
        fail(`failed to load ${url}`)
      }

      await Page.loadEventFired()
      const ready = await is_ready()

      if (!ready) {
        fail(`failed to render ${url}`)
      }

      handle_exceptions = false

      const result = await evaluate<Suite>("Tests.top_level")
      if (!(result instanceof Value)) {
        // TODO: Failure.text
        fail("internal error: failed to collect tests")
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
      }

      type TestItem = [Suite[], Test, Status]

      function* iter({suites, tests}: Suite, parents: Suite[] = []): Iterable<TestItem> {
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
      const test_suite = all_tests

      if (argv.k != null || argv.grep != null) {
        if (argv.k != null) {
          const keyword = argv.k as string
          for (const [suites, test] of test_suite) {
            if (!description(suites, test).includes(keyword)) {
              test.skip = true
            }
          }
        }

        if (argv.grep != null) {
          const regex = new RegExp(argv.grep as string)
          for (const [suites, test] of test_suite) {
            if (!description(suites, test).match(regex) != null) {
              test.skip = true
            }
          }
        }
      }

      if (test_suite.length == 0) {
        fail("nothing to test")
      }

      if (!test_suite.some(([, test]) => !test.skip)) {
        fail("nothing to test because all tests were skipped")
      }

      const progress = new Bar({
        format: "{bar} {percentage}% | {value} of {total}{failures}{skipped}",
        stream: process.stdout,
        noTTYOutput: true,
        notTTYSchedule: 1000,
      }, Presets.shades_classic)

      const baselines_root = (argv.baselinesRoot as string | undefined) ?? null
      const baseline_names = new Set<string>()

      let skipped = 0
      let failures = 0

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
          if (value == 0)
            return ""
          else if (value == 1)
            return ` | 1 ${single}`
          else
            return ` | ${value} ${plural ?? single}`

        }
        return {
          failures: format(failures, "failure", "failures"),
          skipped: format(skipped, "skipped"),
        }
      }

      progress.start(test_suite.length, 0, state())

      try {
        for (const [suites, test, status] of test_suite) {
          entries = []

          const baseline_name = encode(description(suites, test, "__"))
          status.baseline_name = baseline_name

          if (baseline_names.has(baseline_name)) {
            status.errors.push("duplicated description")
            status.failure = true
          } else {
            baseline_names.add(baseline_name)
          }

          if (test.skip) {
            status.skipped = true
          } else {
            async function run_test(i: number | null, status: Status): Promise<boolean> {
              let may_retry = false
              const seq = JSON.stringify(to_seq(suites, test))
              const output = await (async () => {
                if (test.dpr != null)
                  override_metrics(test.dpr)
                try {
                  return await evaluate<Result>(`Tests.run(${seq})`)
                } finally {
                  if (test.dpr != null)
                    override_metrics()
                }
              })()
              try {
                const errors = entries.filter((entry) => entry.level == "error")
                if (errors.length != 0) {
                  status.errors.push(...errors.map((entry) => entry.text))
                  // status.failure = true // XXX: too chatty right now
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
                  } else if (baselines_root != null) {
                    const {state} = result
                    if (state == null) {
                      status.errors.push("state not present in output")
                      status.failure = true
                    } else {
                      await (async () => {
                        const baseline_path = path.join(baselines_root, baseline_name)

                        const baseline = create_baseline([state])
                        await fs.promises.writeFile(baseline_path, baseline)
                        status.baseline = baseline

                        const existing = load_baseline(baseline_path)
                        if (existing != baseline) {
                          if (existing == null) {
                            status.errors.push("missing baseline")
                          }
                          const diff = diff_baseline(baseline_path)
                          status.failure = true
                          status.baseline_diff = diff
                          status.errors.push(diff)
                        }
                      })()

                      await (async () => {
                        const baseline_path = path.join(baselines_root, platform, baseline_name)

                        const {bbox} = result
                        if (bbox != null) {
                          const image = await Page.captureScreenshot({format: "png", clip: {...bbox, scale: 1}})
                          const current = Buffer.from(image.data, "base64")
                          status.image = current

                          const image_path = `${baseline_path}.png`
                          const write_image = async () => fs.promises.writeFile(image_path, current)
                          const existing = load_baseline_image(image_path)

                          switch (argv.screenshot) {
                            case undefined:
                            case "test":
                              if (existing == null) {
                                status.failure = true
                                status.errors.push("missing baseline image")
                                await write_image()
                              } else {
                                status.reference = existing
                                const diff_result = diff_image(existing, current)
                                if (diff_result != null) {
                                  may_retry = true
                                  const {diff, pixels, percent} = diff_result
                                  const threshold = test.threshold ?? 0
                                  if (pixels > threshold) {
                                    await write_image()
                                    status.failure = true
                                    status.image_diff = diff
                                    status.errors.push(`images differ by ${pixels}px (${percent.toFixed(2)}%)${i != null ? ` (i=${i})` : ""}`)
                                  }
                                }
                              }
                              break
                            case "save":
                              await write_image()
                              break
                            case "skip":
                              break
                            default:
                              throw new Error(`invalid argument --screenshot=${argv.screenshot}`)
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

            const retry = await run_test(null, status)
            if (argv.retry && retry) {
              for (let i = 0; i < 10; i++) {
                await run_test(i, status)
              }
            }
          }

          if (status.skipped)
            skipped++
          if (status.failure || status.timeout)
            failures++

          progress.increment(1, state())
        }
      } finally {
        progress.stop()
      }

      for (const [suites, test, status] of test_suite) {
        if (status.failure || status.timeout) {
          console.log("")

          let depth = 0
          for (const suite of [...suites, test]) {
            const is_last = depth == suites.length
            const prefix = depth == 0 ? chalk.red("\u2717") : `${" ".repeat(depth)}\u2514${is_last ? "\u2500" : "\u252c"}\u2500`
            console.log(`${prefix} ${suite.description}`)
            depth++
          }
          for (const error of status.errors) {
            console.log(error)
          }
        }
      }

      if (baselines_root != null) {
        const json = JSON.stringify(test_suite.map(([suites, test, status]) => {
          const {failure, image, image_diff, reference} = status
          return [descriptions(suites, test), {failure, image, image_diff, reference}]
        }), (_key, value) => {
          if (value?.type == "Buffer")
            return Buffer.from(value.data).toString("base64")
          else
            return value
        })
        await fs.promises.writeFile(path.join(baselines_root, platform, "report.json"), json)

        const files = new Set(await fs.promises.readdir(baselines_root))

        files.delete("linux")
        files.delete("macos")
        files.delete("windows")

        for (const name of baseline_names) {
          files.delete(name)
        }

        if (files.size != 0) {
          fail(`there are outdated baselines:\n${[...files].join("\n")}`)
        }
      }

      if (failures != 0) {
        throw new Exit(1)
      }
    } finally {
      await Runtime.discardConsoleEntries()
    }
  } catch (err) {
    failure = true
    if (!(err instanceof Exit))
      console.error(`INTERNAL ERROR: ${err.stack ?? err}`)
  } finally {
    if (client) {
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

const min_version = 83

async function check_version(version: string): Promise<boolean> {
  const match = version.match(/Chrome\/(?<major>\d+)\.(\d+)\.(\d+)\.(\d+)/)
  const major = parseInt(match?.groups?.major ?? "0")
  const ok = min_version <= major
  if (!ok)
    console.error(`${chalk.red("failed:")} ${version} is not supported, minimum supported version is ${chalk.magenta(min_version)}`)
  return ok
}

async function main(): Promise<void> {
  const {browser, protocol} = await get_version()
  console.log(`Running in ${chalk.cyan(browser)} using devtools protocol ${chalk.cyan(protocol)}`)
  const ok0 = await check_version(browser)
  const ok1 = await run_tests()
  if (!(ok0 && ok1))
    process.exit(1)
}

main()
