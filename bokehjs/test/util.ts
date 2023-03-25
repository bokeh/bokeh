import {stub} from "sinon"
import {logger} from "@bokehjs/core/logging"

export type TrapOutput = {
  log: string
  trace: string
  debug: string
  info: string
  warn: string
  error: string
}

export function trap(fn: () => void): TrapOutput {
  const result = {
    log: "",
    trace: "",
    debug: "",
    info: "",
    warn: "",
    error: "",
  }
  function join(args: unknown[]): string {
    return args.map((arg) => `${arg}`).join(" ") + "\n"
  }
  // XXX: stubing both console and logger, and including logger's name manually is a hack,
  // but that's be best we can do (at least for now) while preserving logger's ability to
  // to reference the original location from where a logging method was called.
  const log = stub(console, "log").callsFake((...args) => {result.log += join(args)})
  const ctrace = stub(console, "trace").callsFake((...args) => {result.trace += join(args)})
  const ltrace = stub(logger, "trace").callsFake((...args) => {result.trace += join(["[bokeh]", ...args])})
  const cdebug = stub(console, "debug").callsFake((...args) => {result.debug += join(args)})
  const ldebug = stub(logger, "debug").callsFake((...args) => {result.debug += join(["[bokeh]", ...args])})
  const cinfo = stub(console, "info").callsFake((...args) => {result.info += join(args)})
  const linfo = stub(logger, "info").callsFake((...args) => {result.info += join(["[bokeh]", ...args])})
  const cwarn = stub(console, "warn").callsFake((...args) => {result.warn += join(args)})
  const lwarn = stub(logger, "warn").callsFake((...args) => {result.warn += join(["[bokeh]", ...args])})
  const cerror = stub(console, "error").callsFake((...args) => {result.error += join(args)})
  const lerror = stub(logger, "error").callsFake((...args) => {result.error += join(["[bokeh]", ...args])})
  try {
    fn()
  } finally {
    log.restore()
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
  }
  return result
}
