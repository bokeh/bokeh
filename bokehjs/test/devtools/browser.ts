import CDP from "chrome-remote-interface"
import chalk from "chalk"

import type {Version} from "./types.js"
import {Exit, TimeoutError} from "./types.js"

// Runtime.evaluate includes the complete async test body. A few integration
// tests legitimately need more than ten seconds under software-rendered CI,
// while this still puts a firm bound on an unresponsive browser.
const DEFAULT_COMMAND_TIMEOUT = 30_000

function error_message(error: unknown): string {
  return error instanceof Error ? error.message : `${error}`
}

export class BrowserError extends Error {
  constructor(public operation: string, message: string) {
    super(`${operation}: ${message}`)
    this.name = "BrowserError"
  }
}

export class BrowserTimeoutError extends BrowserError {
  constructor(operation: string, public timeout: number) {
    super(operation, `browser did not respond within ${timeout} ms`)
    this.name = "BrowserTimeoutError"
  }
}

async function command<T>(operation: string, promise: Promise<T>, wait: number = DEFAULT_COMMAND_TIMEOUT): Promise<T> {
  const timeout = Promise.withResolvers<never>()
  const timer = setTimeout(() => timeout.reject(new TimeoutError()), wait)
  timer.unref()

  try {
    return await Promise.race([promise, timeout.promise])
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw new BrowserTimeoutError(operation, wait)
    } else if (error instanceof BrowserError) {
      throw error
    } else {
      throw new BrowserError(operation, error_message(error))
    }
  } finally {
    clearTimeout(timer)
  }
}

export type LogEntry = {
  level: "warning" | "error"
  text: string
}

export type Exception = {
  text: string
}

type CDPClient = Awaited<ReturnType<typeof CDP>>

type CDPProtocol = Pick<CDPClient, "Emulation" | "Network" | "Browser" | "Page" | "DOM" | "Runtime" | "Log" | "Performance">

export class Value<T> {
  constructor(public value: T) {}
}

export class Failure {
  constructor(public text: string) {}
}

export const supported_chromium_version: Version = [141, 0, 7390, 54]

export function get_version_tuple(version: string): Version | null {
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

export function check_version(current_chromium_version: Version | null): void {
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

export class BrowserManager {
  private client: CDPClient | null = null
  private protocol: CDPProtocol | null = null
  private entries: LogEntry[] = []
  private exceptions: Exception[] = []

  static async get_version(port: number, host: string = "localhost"): Promise<{browser: string, protocol: string, major: number}> {
    const version = await command("Browser.getVersion", CDP.Version({port, host}))
    const browser_str = version.Browser
    const protocol_str = version["Protocol-Version"]

    const version_tuple = get_version_tuple(browser_str)
    check_version(version_tuple)
    const major = version_tuple != null ? version_tuple[0] : 0

    return {
      browser: browser_str,
      protocol: protocol_str,
      major,
    }
  }

  async connect(port: number, host: string = "localhost"): Promise<void> {
    this.client = await command("Browser.connect", CDP({port, host}))
    const {Emulation, Network, Browser, Page, DOM, Runtime, Log, Performance} = this.client

    this.protocol = {Emulation, Network, Browser, Page, DOM, Runtime, Log, Performance}

    Runtime.exceptionThrown(({exceptionDetails}) => {
      this.exceptions.push(this.handle_exception(exceptionDetails))
    })

    Runtime.consoleAPICalled(({type, args}) => {
      if (type == "warning" || type == "error") {
        const text = args.map(({value}) => value ? value.toString() : "").join(" ")
        this.entries.push({level: type, text})
      }
    })

    Log.entryAdded(({entry}) => {
      const {level, text} = entry
      if (level == "warning" || level == "error") {
        this.entries.push({level, text})
      }
    })
  }

  async close(): Promise<void> {
    if (this.client != null) {
      const client = this.client
      this.client = null
      this.protocol = null
      await command("Browser.disconnect", client.close(), 2000)
    }
  }

  async reset(): Promise<void> {
    try {
      await this.close()
    } catch {}
    this.entries = []
    this.exceptions = []
  }

  get_protocol(): CDPProtocol {
    if (this.protocol == null) {
      throw new Error("Browser not connected")
    }
    return this.protocol
  }

  get_entries(): LogEntry[] {
    return this.entries
  }

  get_exceptions(): Exception[] {
    return this.exceptions
  }

  clear_entries(): void {
    this.entries = []
  }

  clear_exceptions(): void {
    this.exceptions = []
  }

  private handle_exception(exceptionDetails: any): Exception {
    const {text, exception} = exceptionDetails
    const formatted = exception != null && exception.description != null ? exception.description : text
    return {text: formatted}
  }

  async initialize_page(url: string): Promise<void> {
    const {Emulation, Network, Browser, Page, DOM, Runtime, Log, Performance} = this.get_protocol()

    await command("Network.enable", Network.enable())
    await command("Network.setCacheDisabled", Network.setCacheDisabled({cacheDisabled: true}))

    await command("Page.enable", Page.enable())
    await command("Page.navigate(about:blank)", Page.navigate({url: "about:blank"}))

    // Discard diagnostics from a previous execution context. In particular,
    // navigating away from a timed-out test can report errors while aborting
    // its outstanding work.
    this.clear_entries()
    this.clear_exceptions()

    await command("DOM.enable", DOM.enable({}))

    await command("Runtime.enable", Runtime.enable())
    await command("Log.enable", Log.enable())
    await command("Performance.enable", Performance.enable({timeDomain: "timeTicks"}))

    await this.override_metrics()
    await command("Emulation.setFocusEmulationEnabled", Emulation.setFocusEmulationEnabled({enabled: true}))

    await command("Browser.grantPermissions", Browser.grantPermissions({
      permissions: ["clipboardReadWrite"],
    }))

    const {errorText} = await command(`Page.navigate(${url})`, Page.navigate({url}))

    if (errorText != null) {
      this.fail(errorText)
    }

    if (this.exceptions.length != 0) {
      for (const exc of this.exceptions) {
        console.log(exc.text)
      }
      this.fail(`failed to load ${url}`)
    }

    await command("Page.loadEventFired", Page.loadEventFired(), 30000)
  }

  async override_metrics(settings: {dpr?: number, scale?: number} = {}): Promise<void> {
    const {Emulation} = this.get_protocol()
    await command("Emulation.setDeviceMetricsOverride", Emulation.setDeviceMetricsOverride({
      width: 2000,
      height: 4000,
      deviceScaleFactor: settings.dpr ?? 1,
      mobile: false,
      scale: settings.scale ?? 1,
    }))
  }

  async evaluate<T>(expression: string, eval_timeout: number = DEFAULT_COMMAND_TIMEOUT): Promise<Value<T> | Failure> {
    const {Runtime} = this.get_protocol()

    const output = await command(
      "Runtime.evaluate",
      Runtime.evaluate({expression, returnByValue: true, awaitPromise: true}),
      eval_timeout,
    )

    const {result, exceptionDetails} = output
    if (exceptionDetails == null) {
      return new Value(result.value)
    } else {
      const {text} = this.handle_exception(exceptionDetails)
      return new Failure(text)
    }
  }

  async is_ready(): Promise<boolean> {
    const expr = "typeof Bokeh !== 'undefined'"
    const result = await this.evaluate<boolean>(expr)
    return result instanceof Value && result.value
  }

  async capture_screenshot(bbox: {x: number, y: number, width: number, height: number}): Promise<Buffer> {
    const {Page} = this.get_protocol()
    const image = await command("Page.captureScreenshot", Page.captureScreenshot({format: "png", clip: {...bbox, scale: 1}}))
    return Buffer.from(image.data, "base64")
  }

  async discard_console_entries(): Promise<void> {
    const {Runtime} = this.get_protocol()
    await command("Runtime.discardConsoleEntries", Runtime.discardConsoleEntries())
  }

  async get_metrics(): Promise<Array<{name: string, value: number}>> {
    const {Performance} = this.get_protocol()
    const data = await command("Performance.getMetrics", Performance.getMetrics())
    return data.metrics
  }

  private fail(msg: string, code: number = 1): never {
    console.log(msg)
    throw new Exit(code)
  }
}
