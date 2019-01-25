import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")
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
      const {result, exceptionDetails} = await Runtime.evaluate({expression, awaitPromise: true})

      if (exceptionDetails == null)
        return result.value !== undefined ? {value: result.value}: null
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

    const ret = await evaluate<string>("JSON.stringify(top_level)")
    if (ret != null) {
      const top_level = JSON.parse(ret.value)
      type Suite = {description: string, suites: Suite[], tests: Test[]}
      type Test = {description: string}
      async function run({suites, tests}: Suite, seq: number[]) {
        for (let i = 0; i < suites.length; i++) {
          console.log(`${"  ".repeat(seq.length)}${suites[i].description}`)
          await run(suites[i], seq.concat(i))
        }

        for (let i = 0; i < tests.length; i++) {
          messages = []
          errors = []

          console.log(`${"  ".repeat(seq.length)}${tests[i].description}`)
          const start = Date.now()
          const x0 = evaluate(`run_test(${JSON.stringify(seq.concat(i))})`)
          const x1 = timeout(5000)
          try {
            await Promise.race([x0, x1])
          } catch(err) {
            if (err instanceof TimeoutError) {
              console.log("timeout")
              continue
            }
          }

          await Page.captureScreenshot({format: "png"}) //, clip: await get_bbox()})

          console.log(`test run in ${Date.now() - start} ms`)
          for (const {text} of messages) {
            console.log(text)
          }

          for (const {text} of errors) {
            console.log(text)
          }
        }
      }

      await run(top_level, [])
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

run_tests()
