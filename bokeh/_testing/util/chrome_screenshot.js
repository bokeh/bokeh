const CDP = require('chrome-remote-interface')

const path = require('path')
const fs = require('fs')

const mkdirp = require('mkdirp')

const {max, ceil} = Math

const argv = process.argv.slice(2)

const file = argv[0]
const is_url = file.startsWith("file://") || file.startsWith("http://") || file.startsWith("https://")
const url = is_url ? file : `file://${path.resolve(file)}`
const png = argv[1] || path.basename(file, ".html") + ".png"
const pause = parseInt(argv[2]) || 100
const timeout = parseInt(argv[3]) || 15000

/*
interface CallFrame {
  name: string
  url: string
  line: number
  col: number
}

interface Error {
  text: string
  url: string
  line: number
  col: number
  trace: CallFrame[]
}

interface Message {
  level: string
  text: string
  url: string
  line: number
  col: number
  trace: CallFrame[]
}

interface Output {
  success: boolean
  timeout: boolean
  errors: Error[]
  messages: Message[]
}
*/

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled rejection at: ', reason)
  process.exit(1)
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

CDP(async function(client) {
  const {DOM, Emulation, Log, Page, Runtime} = client

  await DOM.enable()
  await Log.enable()
  await Page.enable()
  await Runtime.enable()

  await Emulation.setDeviceMetricsOverride({width: 1000, height: 1000, deviceScaleFactor: 0, mobile: false})

  const messages = []
  const errors = []

  let context_id = null

  function collect_trace(stackTrace) {
    if (stackTrace == null)
      return []
    else
      return stackTrace.callFrames.map(({functionName, url, lineNumber, columnNumber}) => {
        return {name: functionName || "(anonymous)", url, line: lineNumber+1, col: columnNumber+1}
      })
  }

  Runtime.executionContextCreated(({context}) => context_id = context.id)

  Runtime.consoleAPICalled(({type, args, stackTrace, executionContextId}) => {
    if (executionContextId !== context_id)
      return
    const text = args.map(({value}) => value.toString()).join(" ")
    const trace = collect_trace(stackTrace)
    const {url, line, col} = trace[0]
    messages.push({level: type, text, url, line, col, trace})
  })

  Runtime.exceptionThrown(({exceptionDetails}) => {
    if (exceptionDetails.executionContextId !== context_id)
      return
    const {exception: {description: text}, lineNumber, columnNumber, url, stackTrace} = exceptionDetails
    errors.push({text, url, line: lineNumber+1, col: columnNumber+1, trace: collect_trace(stackTrace)})
  })

  Log.entryAdded(({entry}) => {
    const {source, level, text, url, lineNumber, stackTrace} = entry
    if (source === "network" && level === "error") {
      errors.push({level, text, url, line: lineNumber+1, col: 1, trace: collect_trace(stackTrace)})
    }
  })

  async function screenshot() {
    const {result: {value: margin}} = await Runtime.evaluate({expression: "parseFloat(getComputedStyle(document.body).margin)"})

    const {result: {value: width}}  = await Runtime.evaluate({expression: "document.body.scrollWidth"})
    const {result: {value: height}} = await Runtime.evaluate({expression: "document.body.scrollHeight"})

    const adjust = (value, step=50) => Math.max(ceil(value/step)*step, 1000)
    const [adjusted_width, adjusted_heigth] = [adjust(width + 2*margin), adjust(height + 2*margin)]

    await Emulation.setDeviceMetricsOverride({width: adjusted_width, height: adjusted_heigth, deviceScaleFactor: 0, mobile: false})

    const image = await Page.captureScreenshot({format: "png"})
    const buffer = new Buffer(image.data, 'base64')
    mkdirp.sync(path.dirname(png))
    fs.writeFileSync(png, buffer, 'base64')
  }

  async function is_idle() {
    const script = "typeof Bokeh !== 'undefined' && Bokeh.documents.length !== 0 && Bokeh.documents[0].is_idle"
    const {result, exceptionDetails} = await Runtime.evaluate({expression: script})

    if (result.type === "boolean")
      return result.value
    else {
      const {text, lineNumber, columnNumber, url, stackTrace} = exceptionDetails
      errors.push({text, url, line: lineNumber+1, col: columnNumber+1, trace: collect_trace(stackTrace)})
      return null
    }
  }

  async function finish(timeout, success) {
    if (success)
      await screenshot()

    console.log(JSON.stringify({
      success: success,
      timeout: timeout,
      errors: errors,
      messages: messages,
    }))

    await client.close()
  }

  Page.loadEventFired(async () => {
    if (errors.length > 0) {
      await finish(false, false)
      return
    }

    for (let i = 0; i < timeout/pause; i++) {
      await wait(pause)
      const ret = await is_idle()

      if (ret === false)
        continue

      await finish(false, ret === true)
      return
    }

    await finish(true, true)
  })

  const result = await Page.navigate({url})
  if ("errorText" in result) {
    console.error(`Cannot load resource: ${url} (${result.errorText})`)
    process.exit(1)
  }
}).on('error', (err) => {
  console.error('Cannot connect to browser: ', err)
  process.exit(1)
})
