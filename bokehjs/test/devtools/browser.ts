import type {Browser, CDPSession, Page} from "playwright-core"
import {chromium} from "playwright-core"
import chalk from "chalk"

import type {Version} from "./types.js"
import {TimeoutError} from "./types.js"

// page.evaluate() includes the complete async test body and doesn't have its
// own timeout. A few integration tests legitimately need more than ten seconds
// under software-rendered CI, while this still puts a firm bound on a hung page.
const DEFAULT_COMMAND_TIMEOUT = 30_000

function error_message(error: unknown): string {
  return error instanceof Error ? error.stack ?? error.message : `${error}`
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

function is_browser_lifecycle_error(error: BrowserError): boolean {
  const message = error.message.toLowerCase()
  return [
    "execution context was destroyed",
    "target page, context or browser has been closed",
    "page crashed",
  ].some((pattern) => message.includes(pattern))
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

type PerformanceMetrics = {
  metrics: Array<{name: string, value: number}>
}

export class BrowserManager {
  private browser: Browser | null = null
  private page: Page | null = null
  private session: CDPSession | null = null
  private entries: LogEntry[] = []
  private exceptions: Exception[] = []
  private crashed = false

  constructor(private readonly executable: string) {}

  async launch(): Promise<void> {
    const in_docker = (process.env.BOKEH_IN_DOCKER ?? "") == "1"
    const args = [
      "--font-render-hinting=none",           // fixes measureText() on Linux with external fonts
      "--disable-font-subpixel-positioning",  // makes images look similar on all platforms
      "--force-color-profile=srgb",           // ^^^
      "--force-device-scale-factor=1",        // ^^^
    ]
    if (in_docker) {
      // Containers have no hardware GPU. Keep WebGL enabled through Chrome's
      // supported software renderer instead of disabling GPU-backed coverage.
      args.push("--enable-unsafe-swiftshader")
    }

    const browser = await command("Browser.launch", chromium.launch({
      executablePath: this.executable,
      headless: true,
      // Ubuntu CI runners disable the unprivileged user namespaces Chromium's
      // sandbox requires. Preserve sandboxing for ordinary local runs.
      chromiumSandbox: !in_docker && process.env.CI != "true",
      // Scrollbars are part of widget layout and visual baselines. Playwright
      // hides them by default, unlike the former BokehJS Chrome launcher.
      ignoreDefaultArgs: ["--hide-scrollbars"],
      args,
    }))
    browser.on("disconnected", () => {
      this.crashed = true
    })
    this.browser = browser

    const context = await command("Browser.newContext", browser.newContext({
      viewport: {width: 2000, height: 4000},
      deviceScaleFactor: 1,
    }))
    await command("Browser.grantPermissions", context.grantPermissions(["clipboard-read", "clipboard-write"]))

    const page = await command("Browser.newPage", context.newPage())
    page.on("console", (message) => {
      const level = message.type()
      if (level == "warning" || level == "error") {
        this.entries.push({level, text: message.text()})
      }
    })
    page.on("pageerror", (error) => {
      this.exceptions.push({text: error.stack ?? error.message})
    })
    page.on("crash", () => {
      this.crashed = true
    })
    page.on("requestfailed", (request) => {
      const failure = request.failure()
      this.entries.push({level: "error", text: `${request.url()}: ${failure?.errorText ?? "request failed"}`})
    })

    const session = await command("Browser.newCDPSession", context.newCDPSession(page))
    await command("Network.enable", session.send("Network.enable"))
    await command("Network.setCacheDisabled", session.send("Network.setCacheDisabled", {cacheDisabled: true}))
    await command("Performance.enable", session.send("Performance.enable", {timeDomain: "timeTicks"}))

    this.page = page
    this.session = session
    this.crashed = false
  }

  get_version(): {browser: string, major: number} {
    const version = this.get_browser().version()
    const version_tuple = get_version_tuple(version)
    check_version(version_tuple)
    return {
      browser: `Chrome/${version}`,
      major: version_tuple != null ? version_tuple[0] : 0,
    }
  }

  async close(): Promise<void> {
    const browser = this.browser
    this.browser = null
    this.page = null
    this.session = null
    this.crashed = false
    if (browser != null) {
      await command("Browser.close", browser.close(), 5000)
    }
  }

  async reset(): Promise<void> {
    try {
      await this.close()
    } catch {}
    this.entries = []
    this.exceptions = []
  }

  private get_browser(): Browser {
    if (this.browser == null) {
      throw new Error("Browser not launched")
    }
    return this.browser
  }

  private get_page(): Page {
    if (this.page == null) {
      throw new Error("Browser not launched")
    }
    return this.page
  }

  private get_session(): CDPSession {
    if (this.session == null) {
      throw new Error("Browser not launched")
    }
    return this.session
  }

  private is_available(): boolean {
    return !this.crashed && this.browser?.isConnected() == true && this.page?.isClosed() == false
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

  async initialize_page(url: string): Promise<void> {
    const page = this.get_page()
    await command("Page.navigate(about:blank)", page.goto("about:blank", {waitUntil: "load"}))
    await command(`Page.navigate(${url})`, page.goto(url, {waitUntil: "load"}))
  }

  async override_metrics(settings: {dpr?: number, scale?: number} = {}): Promise<void> {
    const session = this.get_session()
    await command("Emulation.setDeviceMetricsOverride", session.send("Emulation.setDeviceMetricsOverride", {
      width: 2000,
      height: 4000,
      deviceScaleFactor: settings.dpr ?? 1,
      mobile: false,
      scale: settings.scale ?? 1,
    }))
  }

  async evaluate<T>(expression: string, eval_timeout: number = DEFAULT_COMMAND_TIMEOUT): Promise<Value<T> | Failure> {
    const page = this.get_page()
    try {
      const value = await command("Page.evaluate", page.evaluate<T>(expression), eval_timeout)
      return new Value(value)
    } catch (error) {
      if (error instanceof BrowserTimeoutError ||
          (error instanceof BrowserError && is_browser_lifecycle_error(error)) ||
          !this.is_available()) {
        throw error
      }
      const text = error instanceof BrowserError ? error.message.replace(/^Page\.evaluate: /, "") : error_message(error)
      return new Failure(text)
    }
  }

  async is_ready(): Promise<boolean> {
    const expr = "typeof Bokeh !== 'undefined'"
    const result = await this.evaluate<boolean>(expr)
    return result instanceof Value && result.value
  }

  async capture_screenshot(bbox: {x: number, y: number, width: number, height: number}): Promise<Buffer> {
    const page = this.get_page()
    const image = await command("Page.screenshot", page.screenshot({
      type: "png",
      clip: bbox,
      animations: "allow",
      caret: "initial",
      scale: "device",
    }))
    return Buffer.from(image)
  }

  async get_metrics(): Promise<Array<{name: string, value: number}>> {
    const session = this.get_session()
    const data = await command("Performance.getMetrics", session.send("Performance.getMetrics")) as PerformanceMetrics
    return data.metrics
  }
}
