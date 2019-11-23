import {stub} from "sinon"

export function trap(fn: () => void): string {
  let text = ""
  function collect(...args: unknown[]): void {
    text += args.map((arg) => `${arg}`).join(" ") + "\n"
  }
  const log = stub(console, "log").callsFake(collect)
  const trace = stub(console, "trace").callsFake(collect)
  const debug = stub(console, "debug").callsFake(collect)
  const info = stub(console, "info").callsFake(collect)
  const warn = stub(console, "warn").callsFake(collect)
  const error = stub(console, "error").callsFake(collect)
  try {
    fn()
  } finally {
    log.reset()
    trace.reset()
    debug.reset()
    info.reset()
    warn.reset()
    error.reset()
  }
  return text
}
