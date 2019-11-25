import {stub} from "sinon"

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
  const log = stub(console, "log").callsFake((...args) => {result.log += join(args)})
  const trace = stub(console, "trace").callsFake((...args) => {result.trace += join(args)})
  const debug = stub(console, "debug").callsFake((...args) => {result.debug += join(args)})
  const info = stub(console, "info").callsFake((...args) => {result.info += join(args)})
  const warn = stub(console, "warn").callsFake((...args) => {result.warn += join(args)})
  const error = stub(console, "error").callsFake((...args) => {result.error += join(args)})
  try {
    fn()
  } finally {
    log.restore()
    trace.restore()
    debug.restore()
    info.restore()
    warn.restore()
    error.restore()
  }
  return result
}
