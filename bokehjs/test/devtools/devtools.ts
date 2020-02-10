import {Protocol} from "devtools-protocol"
import CDP = require("chrome-remote-interface")

import fs = require("fs")
import path = require("path")
import {argv} from "yargs"
import chalk from "chalk"
import {Bar, Presets} from "cli-progress"
import {PNG} from "pngjs"

import {Box, State, create_baseline, load_baseline, diff_baseline, load_baseline_image} from "./baselines"

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

function encode(s: string): string {
  return s.replace(/[ \/]/g, "_")
}

type ImageDiff = {pixels: number, percent: number, diff: Buffer}

function rgba2hsla(r: number, g: number, b: number, a: number): [number, number, number, number] {
  r /= 255, g /= 255, b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  const l = (max + min) / 2
  let h = 0, s = 0

  if (max != min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  const f = Math.round
  return [f(h*360), f(s*100), f(l*100), a]
}

function diff_image(existing: Buffer, current: Buffer): ImageDiff | null {
  const existing_img = PNG.sync.read(existing)
  const current_img = PNG.sync.read(current)

  // TODO: resize
  const same_dims = existing_img.width == current_img.width && existing_img.height == current_img.height
  if (!same_dims) {
    throw new Error("bad dims")
  }

  const {width, height} = current_img
  const diff_img = new PNG({width, height})

  const len = width*height
  const a32 = new Uint32Array(existing_img.data.buffer, existing_img.data.byteOffset, len)
  const b32 = new Uint32Array(current_img.data.buffer, current_img.data.byteOffset, len)
  const c32 = new Uint32Array(diff_img.data.buffer, diff_img.data.byteOffset, len)

  function encode(r: number, g: number, b: number, a: number = 1.0): number {
    return (a*255 & 0xFF) << 24 | (b & 0xFF) << 16 | (g & 0xFF) << 8 | (r & 0xFF)
  }

  function decode(v: number): [number, number, number, number] {
    return [v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, ((v >> 24) & 0xFF) / 255]
  }

  c32.fill(encode(0, 0, 0))

  let pixels = 0
  for (let i = 0; i < len; i++) {
    const a = a32[i]
    const b = b32[i]

    if (a != b) {
      const [r0, g0, b0, a0] = decode(a)
      const [r1, g1, b1, a1] = decode(b)

      const [h0, s0, l0, _a0] = rgba2hsla(r0, g0, b0, a0)
      const [h1, s1, l1, _a1] = rgba2hsla(r1, g1, b1, a1)

      if (!(h0 == h1 && s0 == s1 && l0 == l1 && _a0 == _a1)) {
        const d = (a: number, b: number) => Math.abs(a - b)

        // const [x, y] = [i % width, Math.floor(i / width)]
        // console.log("")
        // console.log(`existing(${x}, ${y}) = RGBA(${r0}, ${g0}, ${b0}, ${a0}) HSLA(${h0}, ${s0}, ${l0}, ${_a0})`)
        // console.log(`current(${x}, ${y})  = RGBA(${r1}, ${g1}, ${b1}, ${a1}) HSLA(${h1}, ${s1}, ${l1}, ${_a1})`)
        // console.log(`d(h0, h1) = ${d(h0, h1)} d(s0, s1) = ${d(s0, s1)} d(l0, l1) = ${d(l0, l1)}`)

        if (!(h0 == h1 && s0 == s1 && d(l0, l1) <= 5 && _a0 == _a1)) {
          pixels++
          c32[i] = encode(0, 0, 255)
        }
      }
    }
  }

  if (pixels == 0) {
    return null
  } else {
    return {
      pixels,
      percent: pixels/(width*height)*100,
      diff: PNG.sync.write(diff_img),
    }
  }
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
                  status.baseline_name = baseline_name

                  if (baseline_names.has(baseline_name)) {
                    status.errors.push("duplicated description")
                    status.failure = true
                  } else {
                    const baseline_path = path.join(baselines_root, baseline_name)
                    baseline_names.add(baseline_name)

                    const {bbox} = result
                    if (bbox != null) {
                      const image = await Page.captureScreenshot({format: "png", clip: {...bbox, scale: 1}})
                      const current = Buffer.from(image.data, "base64")
                      status.image = current

                      const image_path = `${baseline_path}.png`
                      const existing = load_baseline_image(image_path)
                      if (existing == null) {
                        status.failure = true
                        status.errors.push("missing baseline image")
                      } else {
                        status.reference = existing
                        const result = diff_image(existing, current)
                        if (result != null) {
                          await fs.promises.writeFile(image_path, current)
                          status.failure = true
                          status.image_diff = result.diff
                          status.errors.push(`images differ by ${result.pixels}px (${result.percent.toFixed(2)}%)`)
                        }
                      }
                    }

                    const baseline = create_baseline([result.state])
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
                  }
                }
              }
            } finally {
              await evaluate(`Tests.clear(${seq})`)
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

      const json = JSON.stringify(test_suite.map(([suites, test, status]) => {
        const {failure, image, image_diff, reference} = status
        return [descriptions(suites, test), {failure, image, image_diff, reference}]
      }), (_key, value) => {
        if (value?.type == "Buffer")
          return Buffer.from(value.data).toString("base64")
        else
          return value
      })
      await fs.promises.writeFile(path.join("test", "report.json"), json)

      if (baseline_names.size != 0) {
        const files = new Set(await fs.promises.readdir(baselines_root))

        for (const name of baseline_names) {
          files.delete(name)
          files.delete(`${name}.png`)
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
