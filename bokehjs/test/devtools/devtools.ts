import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import fs = require("fs")
import path = require("path")

import {State, create_baseline, load_baseline, diff_baseline} from "./baselines"

const url = `file://${path.resolve(process.argv[2])}`

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

interface Msg {
  level: string
  text: string
  url: string
  line: number
  col: number
  trace: CallFrame[]
}

function log(entries: (Msg | Err)[], options: {prefix?: string} = {}): void {
  for (const {text} of entries) {
    console.log(`${options.prefix ?? ""}${text}`)
  }
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

type Rect = {x: number, y: number, width: number, height: number}
type Suite = {description: string, suites: Suite[], tests: Test[]}
type Test = {description: string}
type Result = {state: State, bbox: Rect, time: number}

async function run_tests(): Promise<void> {
  let client
  let failure = false
  try {
    client = await CDP()
    const {Network, Page, Runtime, Log} = client
    try {
      let messages: Msg[] = []
      let errors: Err[] = []

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

      Runtime.consoleAPICalled((arg) => {
        console.log("CONSOLE", arg)
        const {type, args, stackTrace} = arg
        const text = args.map(({value}) => value ? value.toString() : "").join(" ")

        let msg: Msg
        if (stackTrace != null) {
          const trace = collect_trace(stackTrace)
          const {url, line, col} = trace[0]
          msg = {level: type, text, url, line, col, trace}
        } else
          msg = {level: type, text, url: "(inline)", line: 1, col: 1, trace: []}

        messages.push(msg)
      })

      Log.entryAdded(({entry}) => {
        console.log("LOG")
        const {source, level, text, url, lineNumber, stackTrace} = entry
        if (source === "network" && level === "error") {
          errors.push({
            text,
            url: url || "(inline)",
            line: lineNumber != null ? lineNumber+1 : 1,
            col: 1,
            trace: stackTrace != null ? collect_trace(stackTrace) : [],
          })
        }
      })

      let handle_exceptions = true
      Runtime.exceptionThrown(({exceptionDetails}) => {
        console.log("EXC", exceptionDetails)
        if (handle_exceptions) {
          errors.push(handle_exception(exceptionDetails))
        }
      })

      function fail(msg: string, code: number = 1): never {
        console.log(msg)
        log(messages)
        log(errors)
        throw new Exit(code)
      }

      async function evaluate<T>(expression: string): Promise<{value: T} | null> {
        const {result, exceptionDetails} = await Runtime.evaluate({expression, awaitPromise: true}) // returnByValue: true
        if (exceptionDetails == null)
          return result.value !== undefined ? {value: result.value} : null
        else {
          errors.push(handle_exception(exceptionDetails))
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

      const {frameId, errorText} = await Page.navigate({url})
      console.log(frameId)

      if (errorText != null) {
        fail(errorText)
      }

      if (errors.length != 0) {
        fail(`failed to load ${url}`)
      }

      await Page.loadEventFired()
      await is_ready()

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
          messages = []
          errors = []

          const prefix = "  ".repeat(seq.length)

          console.log(`${prefix}${tests[i].description}`)
          //const start = Date.now()
          const x0 = evaluate<string>(`Tests.run_test(${JSON.stringify(seq.concat(i))})`)
          const x1 = timeout(5000)
          let output
          try {
            output = await Promise.race([x0, x1])
          } catch(err) {
            if (err instanceof TimeoutError) {
              console.log("timeout")
              continue
            }
          }

          console.log(output)
          const result = JSON.parse((output as {value: string}).value) as Result

          //const image = await Page.captureScreenshot({format: "png", clip: {...result.bbox, scale: 1.0}})
          //console.log(image.data.length)
          function encode(s: string): string {
            return s.replace(/[ \/]/g, "_")
          }

          let failure = false

          if (errors.length != 0) {
            failure = true
            log(messages, {prefix})
            log(errors, {prefix})
          }

          const baseline_name = parents.map((suite) => suite.description).concat(tests[i].description).map(encode).join("__")

          if (baseline_names.has(baseline_name)) {
            console.log(`${prefix}duplicated description`)
            failure = true
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
              failure = true
            }
          }

          if (failure) {
            failures++
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
      console.log("XXX")
      await client.close()
    }
  }

  if (failure)
    process.exit(1)
}

run_tests()
