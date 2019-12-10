import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import fs = require("fs")
import path = require("path")
import {argv} from "yargs"
import chalk from "chalk"

import {State, create_baseline, load_baseline, diff_baseline} from "./baselines"

const url = `file://${path.resolve(argv._[0])}`
const verbose = argv.verbose ?? false

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

//type Rect = {x: number, y: number, width: number, height: number}
type Suite = {description: string, suites: Suite[], tests: Test[]}
type Test = {description: string, skip: boolean}
type Result = {error: {str: string, stack?: string} | null, time: number, state?: State}

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

      Runtime.consoleAPICalled(({args}) => {
        if (verbose) {
          const text = args.map(({value}) => value ? value.toString() : "").join(" ")
          console.log(text)
        }
      })

      Log.entryAdded(({entry}) => {
        if (verbose)
          console.log(entry.text)
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

      async function evaluate<T>(expression: string): Promise<{value: T} | null> {
        const {result, exceptionDetails} = await Runtime.evaluate({expression, awaitPromise: true}) // returnByValue: true
        if (exceptionDetails == null)
          return result.value !== undefined ? {value: result.value} : null
        else {
          console.log(handle_exception(exceptionDetails).text)
          return null
        }
      }

      async function is_ready(): Promise<boolean> {
        const expr = "typeof Bokeh !== 'undefined'"
        const result = await evaluate(expr)
        return result != null && result.value === true
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

      const ret = await evaluate<string>("JSON.stringify(Tests.top_level)")
      if (ret == null) {
        fail("internal error: failed to collect tests")
      }

      const top_level = JSON.parse(ret.value) as Suite
      if (top_level.suites.length == 0) {
        fail("empty test suite")
      }

      const baseline_names = new Set<string>()
      let failures = 0
      async function run({suites, tests}: Suite, parents: Suite[], seq: number[]) {
        for (let i = 0; i < suites.length; i++) {
          console.log(`${"  ".repeat(seq.length)}${suites[i].description}`)
          await run(suites[i], parents.concat(suites[i]), seq.concat(i))
        }

        for (let i = 0; i < tests.length; i++) {
          const test = tests[i]
          const prefix = "  ".repeat(seq.length)

          const grep = argv.grep as string | undefined
          const descs = parents.map((p) => p.description).concat(test.description)
          if (grep != null && !descs.some((desc) => desc.includes(grep)))
            continue

          console.log(`${prefix}\u2713 ${test.description}`)
          if (test.skip) {
            console.log(chalk.yellow("skipping"))
            continue
          }

          //const start = Date.now()
          const x0 = evaluate<string>(`Tests.run_test(${JSON.stringify(seq)}, ${JSON.stringify(i)})`)
          const x1 = timeout(5000)
          let output: {value: string} | null
          try {
            output = await Promise.race([x0, x1]) as any
          } catch(err) {
            if (err instanceof TimeoutError) {
              console.log(chalk.blueBright("timeout"))
              continue
            } else {
              throw err
            }
          }

          if (output == null) {
            console.log(chalk.red("test failed to run"))
            failures++
            continue
          }

          const result = JSON.parse((output).value) as Result
          if (result.error != null) {
            console.log(`${chalk.red("test failed")}: ${result.error.str}`)
            if (result.error.stack != null) {
              console.log(result.error.stack)
            }
            failures++
            continue
          }

          if (result.state != null) {
            const baseline_name = parents.map((suite) => suite.description).concat(test.description).map(encode).join("__")

            if (baseline_names.has(baseline_name)) {
              console.log(`${prefix}duplicated description`)
              failures++
            } else {
              baseline_names.add(baseline_name)

              const baseline_path = path.join("test", "baselines", baseline_name)
              const baseline = create_baseline([result.state])
              await fs.promises.writeFile(baseline_path, baseline)

              const existing = load_baseline(baseline_path)
              if (existing != baseline) {
                if (existing == null)
                  console.log(`${prefix}no baseline`)
                const diff = diff_baseline(baseline_path)
                console.log(diff)
                failures++
              }
            }
          }

          /*
          console.log(`${prefix}test run in ${result.time} ms`)
          console.log(`${prefix}total run in ${Date.now() - start} ms`)
          */
        }
      }

      await run(top_level, [], [])

      if (failures != 0)
        throw new Exit(1)
    } finally {
      await Runtime.discardConsoleEntries()
    }
  } catch (err) {
    failure = true
    if (!(err instanceof Exit))
      console.error("INTERNAL ERROR:", err)
  } finally {
    if (client) {
      await client.close()
    }
  }

  if (failure)
    process.exit(1)
}

run_tests()
