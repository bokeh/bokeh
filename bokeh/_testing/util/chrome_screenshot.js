const CDP = require('chrome-remote-interface')

const path = require('path')

const argv = process.argv.slice(2)

const file = argv[0]
const is_url = file.startsWith("file://") || file.startsWith("http://") || file.startsWith("https://")
const url = is_url ? file : `file://${path.resolve(file)}`
const pause = parseInt(argv[1]) || 100
const timeout = parseInt(argv[2]) || 15000

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
})

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

CDP(async function(client) {
  const {DOM, Emulation, Log, Page, Runtime} = client

  await DOM.enable()
  await Log.enable()
  await Page.enable()
  await Runtime.enable()

  await Emulation.setDeviceMetricsOverride({
    width: 1000,
    height: 1000,
    deviceScaleFactor: 0,
    mobile: false,
  })

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

    const {text, exception, lineNumber, columnNumber, url, stackTrace} = exceptionDetails
    errors.push({
      text: exception != null && exception.description != null ? exception.description : text,
      url,
      line: lineNumber+1,
      col: columnNumber+1,
      trace: collect_trace(stackTrace),
    })
  })

  const jscss = /.*(js|css)$/

  Log.entryAdded(({entry}) => {
    const {source, level, text, url, lineNumber, stackTrace} = entry
    if (source === "network" && level === "error" && jscss.test(url)) {
      errors.push({level, text, url, line: lineNumber+1, col: 1, trace: collect_trace(stackTrace)})
    }
  })

  async function evaluate(expression) {
    const {result, exceptionDetails} = await Runtime.evaluate({expression})

    if (exceptionDetails == null)
      return result
    else {
      const {text, lineNumber, columnNumber, url, stackTrace} = exceptionDetails
      errors.push({text, url, line: lineNumber+1, col: columnNumber+1, trace: collect_trace(stackTrace)})
      return null
    }
  }

  async function get_bbox() {
    const expr = `
      const el = document.body
      const style = getComputedStyle(el)
      const width = Math.ceil(parseFloat(style.marginLeft) + el.scrollWidth + parseFloat(style.marginRight))
      const height = Math.ceil(parseFloat(style.marginTop) + el.scrollHeight + parseFloat(style.marginBottom))
      JSON.stringify([width, height])
    `
    const result = await evaluate(expr)

    if (result != null) {
      const [width, height] = JSON.parse(result.value)
      return {x: 0, y: 0, width, height, scale: 1}
    } else
      return undefined
  }

  /*
  async function get_bbox() {
    const expr = "JSON.stringify(Object.keys(Bokeh.index).map((key) => Bokeh.index[key].el.getBoundingClientRect()))"
    const result = await evaluate(expr)

    if (result != null) {
      const bboxes = JSON.parse(result.value)
      const left = Math.floor(Math.min(...bboxes.map((bbox) => bbox.left)))
      const top = Math.floor(Math.min(...bboxes.map((bbox) => bbox.top)))
      const right = Math.ceil(Math.max(...bboxes.map((bbox) => bbox.right)))
      const bottom = Math.ceil(Math.max(...bboxes.map((bbox) => bbox.bottom)))
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        scale: 1,
      }
    } else
      return undefined
  }
  */

  async function get_image() {
    return await Page.captureScreenshot({format: "png", clip: await get_bbox()})
  }

  async function get_state() {
    const expr = "JSON.stringify(Object.keys(Bokeh.index).map((key) => Bokeh.index[key].serializable_state()))"
    const result = await evaluate(expr)
    return result != null ? JSON.parse(result.value) : null
  }

  async function is_ready() {
    const expr = "typeof Bokeh !== 'undefined'"
    const result = await evaluate(expr)
    return result != null && result.value === true
  }

  async function is_idle() {
    const expr = "Bokeh.documents.length > 0 && Bokeh.documents.every((doc) => doc.is_idle)"
    const result = await evaluate(expr)
    return result != null && result.value === true
  }

  async function finish(timeout, success) {
    let state = null
    let image = null
    if (success) {
      state = await get_state()
      image = await get_image()
    }

    console.log(JSON.stringify({success, timeout, errors, messages, state, image}))

    await client.close()
  }

  Page.loadEventFired(async () => {
    if (errors.length > 0 || !(await is_ready())) {
      await finish(false, false)
      return
    }

    for (let i = 0; i < timeout/pause; i++) {
      const ret = await is_idle()

      if (ret === false) {
        await wait(pause)
        continue
      } else {
        await finish(false, true)
        return
      }
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
