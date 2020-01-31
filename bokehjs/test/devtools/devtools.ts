import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import fs = require("fs")
import path = require("path")
import {argv} from "yargs"
import chalk from "chalk"
import {Bar, Presets} from "cli-progress"

import {Box, State, create_baseline, load_baseline, diff_baseline} from "./baselines"

const url = argv._[0]

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

/*
function defer(ms: number = 0): Promise<void> {
  return new Promise((resolve, _reject) => {
    const timer = setTimeout(() => resolve(), ms)
    timer.unref()
  })
}
*/

function encode(s: string): string {
  return s.replace(/[ \/]/g, "_")
}

type Suite = {description: string, suites: Suite[], tests: Test[]}
type Test = {description: string, skip: boolean}

type Result = {error: {str: string, stack?: string} | null, time: number, state?: State, bbox?: Box}

async function run_tests(): Promise<void> {
  let client
  let failure = false
  let exception = false
  let handle_exceptions = true
  try {
    client = await CDP()
    const {Network, Page, Runtime, Log} = client
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

      async function evaluate<T>(expression: string, timeout: number = 5000): Promise<Value<T> | Failure | Timeout> {
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

      const all_tests = [...iter(top_level)]

      const test_suite = (() => {
        if (argv.k != null || argv.grep != null) {
          let selected_tests = all_tests

          if (argv.k != null) {
            const keyword = argv.k as string
            selected_tests = selected_tests.filter(([suites, test]) => {
              return descriptions(suites, test).some((description) => description.includes(keyword))
            })
          }

          if (argv.grep != null) {
            const regex = new RegExp(argv.grep as string)
            selected_tests = selected_tests.filter(([suites, test]) => {
              return descriptions(suites, test).some((description) => description.match(regex) != null)
            })
          }

          console.log(`selected ${selected_tests.length} tests from ${all_tests.length} total`)
          return selected_tests
        } else
          return all_tests
      })()

      if (test_suite.length == 0) {
        fail("nothing to test")
      }

      const progress = new Bar({
        format: "{bar} {percentage}% | {value} of {total}{failures}{skipped}",
        stream: process.stdout,
        noTTYOutput: true,
        notTTYSchedule: 1000,
      }, Presets.shades_classic)

      const baselines_root = path.join("test", "baselines")
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

          if (test.skip) {
            status.skipped = true
          } else {
            const seq = JSON.stringify(to_seq(suites, test))
            const output = await evaluate<Result>(`Tests.run(${seq})`)
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
                } else if (result.state != null) {
                  const baseline_name = descriptions(suites, test).map(encode).join("__")

                  if (baseline_names.has(baseline_name)) {
                    status.errors.push("duplicated description")
                    status.failure = true
                  } else {
                    const baseline_path = path.join(baselines_root, baseline_name)
                    baseline_names.add(baseline_name)

                    const {bbox} = result
                    if (bbox != null) {
                      const image = await Page.captureScreenshot({format: "png", clip: {...bbox, scale: 1}})
                      const buffer = Buffer.from(image.data, "base64")
                      await fs.promises.writeFile(`${baseline_path}.png`, buffer)
                    }

                    const baseline = create_baseline([result.state])
                    await fs.promises.writeFile(baseline_path, baseline)

                    const existing = load_baseline(baseline_path)
                    if (existing != baseline) {
                      if (existing == null) {
                        status.errors.push("missing baseline")
                      }
                      const diff = diff_baseline(baseline_path)
                      status.errors.push(diff)
                      status.failure = true
                    }
                  }
                }
              }
            } finally {
              await evaluate(`Tests.cleanup(${seq})`)
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

      const files = new Set(await fs.promises.readdir(baselines_root))
      for (const name of baseline_names) {
        files.delete(name)
        files.delete(`${name}.png`)
      }

      if (files.size != 0) {
        fail(`there are outdated baselines:\n${[...files].join("\n")}`)
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
      console.error(`INTERNAL ERROR: ${err}`)
  } finally {
    if (client) {
      await client.close()
    }
  }

  if (failure)
    process.exit(1)
}

run_tests()
