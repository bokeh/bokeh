import type {SinonSpy, SinonStub} from "sinon"
import {stub} from "sinon"

import {logger} from "@bokehjs/core/logging"
import {version} from "@bokehjs/version"

import {delay} from "@bokehjs/core/util/defer"
import {ascii2svg, find_tex, tex2svg, mathml2svg} from "@bokehjs/models/text/mathjax"
import {MathJaxProvider, NoProvider} from "@bokehjs/models/text/providers"
import {MathTextView} from "@bokehjs/models/text/math_text"

export class DelayedInternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {ascii2svg, find_tex, tex2svg, mathml2svg} : null
  }

  async fetch() {
    this.status = "loading"
    void delay(50).then(() => {
      this.status = "loaded"
      this.ready.emit()
    })
  }
}

export class InternalProvider extends MathJaxProvider {
  get MathJax() {
    return this.status == "loaded" ? {ascii2svg, find_tex, tex2svg, mathml2svg} : null
  }
  async fetch() {
    this.status = "loaded"
  }
}

export function with_provider(provider: MathJaxProvider) {
  return async (fn: () => Promise<void>) => {
    const provider_stub = stub(MathTextView.prototype, "provider")
    provider_stub.value(provider)
    try {
      await fn()
    } finally {
      provider_stub.restore()
    }
  }
}

export const with_internal = with_provider(new InternalProvider())
export const with_delayed = with_provider(new DelayedInternalProvider())
export const with_none = with_provider(new NoProvider())

export function restorable<T extends SinonSpy | SinonStub>(spy: T): T & Disposable {
  const disposable_spy = spy as T & Disposable
  disposable_spy[Symbol.dispose] = () => spy.restore()
  return disposable_spy
}

export type TrapOutput = {
  log: string
  trace: string
  debug: string
  info: string
  warn: string
  error: string
}

function _stub_console() {
  const result = {
    log: "",
    trace: "",
    debug: "",
    info: "",
    warn: "",
    error: "",
  }
  function join(...args: unknown[]): string {
    return `${args.map((arg) => `${arg}`).join(" ")}\n`
  }

  const console_log = console.log
  const console_trace = console.trace
  const console_debug = console.debug
  const console_info = console.info
  const console_warn = console.warn
  const console_error = console.error

  const logger_log = logger.log
  const logger_trace = logger.trace
  const logger_debug = logger.debug
  const logger_info = logger.info
  const logger_warn = logger.warn
  const logger_error = logger.error

  // XXX: stubbing both console and logger, and including logger's name manually is a hack,
  // but that's be best we can do (at least for now) while preserving logger's ability to
  // to reference the original location from where a logging method was called.
  const log    = stub(console, "log").callsFake((...args)   => {
    result.log   += join(...args)
    console_log(...args)
  })
  const clog   = stub(logger, "log").callsFake((...args)    => {
    result.log   += join(`[bokeh ${version}]`, ...args)
    logger_log(...args)
  })
  const ctrace = stub(console, "trace").callsFake((...args) => {
    result.trace += join(...args)
    console_trace(...args)
  })
  const ltrace = stub(logger, "trace").callsFake((...args)  => {
    result.trace += join(`[bokeh ${version}]`, ...args)
    logger_trace(...args)
  })
  const cdebug = stub(console, "debug").callsFake((...args) => {
    result.debug += join(...args)
    console_debug(...args)
  })
  const ldebug = stub(logger, "debug").callsFake((...args)  => {
    result.debug += join(`[bokeh ${version}]`, ...args)
    logger_debug(...args)
  })
  const cinfo  = stub(console, "info").callsFake((...args)  => {
    result.info  += join(...args)
    console_info(...args)
  })
  const linfo  = stub(logger, "info").callsFake((...args)   => {
    result.info  += join(`[bokeh ${version}]`, ...args)
    logger_info(...args)
  })
  const cwarn  = stub(console, "warn").callsFake((...args)  => {
    result.warn  += join(...args)
    console_warn(...args)
  })
  const lwarn  = stub(logger, "warn").callsFake((...args)   => {
    result.warn  += join(`[bokeh ${version}]`, ...args)
    logger_warn(...args)
  })
  const cerror = stub(console, "error").callsFake((...args) => {
    result.error += join(...args)
    console_error(...args)
  })
  const lerror = stub(logger, "error").callsFake((...args)  => {
    result.error += join(`[bokeh ${version}]`, ...args)
    logger_error(...args)
  })
  return {
    result() {
      return result
    },
    restore() {
      log.restore()
      clog.restore()
      ctrace.restore()
      ltrace.restore()
      cdebug.restore()
      ldebug.restore()
      cinfo.restore()
      linfo.restore()
      cwarn.restore()
      lwarn.restore()
      cerror.restore()
      lerror.restore()
    },
  }
}

export function trap(fn: () => void): TrapOutput {
  const stub = _stub_console()
  try {
    fn()
  } finally {
    stub.restore()
  }
  return stub.result()
}

export async function async_trap(fn: () => Promise<void>): Promise<TrapOutput> {
  const stub = _stub_console()
  try {
    await fn()
  } finally {
    stub.restore()
  }
  return stub.result()
}
