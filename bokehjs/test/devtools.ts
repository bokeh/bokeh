import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import cp = require("child_process")
import fs = require("fs")
import path = require("path")

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

type Box = {x: number, y: number, width: number, height: number}
type State = {type: string, bbox?: Box, children?: State[]}

function create_baseline(items: State[]): string {
  let baseline = ""

  function descend(items: State[], level: number): void {
    for (const {type, bbox, children} of items) {
      baseline += `${"  ".repeat(level)}${type}`

      if (bbox != null) {
        const {x, y, width, height} = bbox
        baseline += ` bbox=[${x}, ${y}, ${width}, ${height}]`
      }

      baseline += "\n"

      if (children != null)
        descend(children, level+1)
    }
  }

  descend(items, 0)
  return baseline
}

function load_baseline(baseline_path: string): string | null {
  const proc = cp.spawnSync("git", ["show", `:./${baseline_path}`])
  return proc.status == 0 ? proc.stdout : null
}

function diff_baseline(baseline_path: string): string | null {
  const proc = cp.spawnSync("git", ["diff", "--color", "--exit-code", baseline_path], {encoding: "utf8"})
  return proc.status == 0 ? null : diff_highlight(proc.stdout)
}

function diff_highlight(diff: string): string {
  const hl_path = "/usr/share/doc/git/contrib/diff-highlight/diff-highlight"
  const proc = cp.spawnSync("perl", [hl_path], {input: diff, encoding: "utf8"})
  return proc.status == 0 ? proc.stdout : diff
}

async function run_tests(): Promise<void> {
  let client
  try {
    client = await CDP()
    const {Network, Page, Runtime, Log} = client

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

    Runtime.consoleAPICalled(({type, args, stackTrace}) => {
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

    //Runtime.exceptionThrown(({exceptionDetails}) => errors.push(handle_exception(exceptionDetails))

    Log.entryAdded(({entry}) => {
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

    async function evaluate<T>(expression: string): Promise<{value: T} | null> {
      const {result, exceptionDetails} = await Runtime.evaluate({expression, awaitPromise: true}) //, returnByValue: true})

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
    await Runtime.enable()
    await Page.enable()
    await Log.enable()

    await Page.navigate({url})
    await Page.loadEventFired()
    await is_ready()

    const ret = await evaluate<string>("JSON.stringify(exports.top_level)")
    if (ret != null) {
      const top_level = JSON.parse(ret.value) as Suite
      type Suite = {description: string, suites: Suite[], tests: Test[]}
      type Test = {description: string}
      type Result = {state: State, bbox: DOMRect, time: number}
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
          const x0 = evaluate<string>(`exports.run_test(${JSON.stringify(seq.concat(i))})`)
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

          const result = JSON.parse((output as {value: string}).value) as Result

          //console.log(result)
          //const image = await Page.captureScreenshot({format: "png", clip: {...result.bbox, scale: 1.0}})
          //console.log(image.data.length)
          function encode(s: string): string {
            return s.replace(/[ \/]/g, "_")
          }

          let failure = false

          if (errors.length != 0) {
            failure = true

            for (const {text} of messages) {
              console.log(`${prefix}${text}`)
            }

            for (const {text} of errors) {
              console.log(`${prefix}${text}`)
            }
          }

          const baseline_name = parents.map((suite) => suite.description).concat(tests[i].description).map(encode).join("__")

          if (baseline_names.has(baseline_name)) {
            console.log(`${prefix}duplicated description`)
            failure = true
          } else {
            baseline_names.add(baseline_name)

            const baseline_path = path.join("test", "baselines", baseline_name)
            const baseline = create_baseline([result.state])
            fs.writeFileSync(baseline_path, baseline)

            const existing = load_baseline(baseline_path)
            if (existing == null) {
              console.log(`${prefix}no baseline`)
              failure = true
            } else if (existing != baseline) {
              const diff = diff_baseline(baseline_path)
              console.log(diff)
              failure = true
            } else {

            }
          }

          if (failure)
            failures++

          /*
          console.log(`${prefix}test run in ${result.time} ms`)
          console.log(`${prefix}total run in ${Date.now() - start} ms`)
          */
        }
      }

      await run(top_level, [], [])

      if (failures != 0)
        process.exit(1)
    }
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

run_tests()
