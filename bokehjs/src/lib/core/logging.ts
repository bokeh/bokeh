// This is based on https://github.com/pimterry/loglevel

import {isString} from "./util/types"
import {entries} from "./util/object"

const _loggers: {[key: string]: Logger} = {}

export class LogLevel {
  constructor(readonly name: string, readonly level: number) {}
}

export class Logger {

  static TRACE = new LogLevel("trace", 0)
  static DEBUG = new LogLevel("debug", 1)
  static INFO  = new LogLevel("info",  2)
  static WARN  = new LogLevel("warn",  6)
  static ERROR = new LogLevel("error", 7)
  static FATAL = new LogLevel("fatal", 8)
  static OFF   = new LogLevel("off",   9)

  static log_levels: {[key: string]: LogLevel} = {
    trace: Logger.TRACE,
    debug: Logger.DEBUG,
    info:  Logger.INFO,
    warn:  Logger.WARN,
    error: Logger.ERROR,
    fatal: Logger.FATAL,
    off:   Logger.OFF,
  }

  static get levels(): string[] {
    return Object.keys(Logger.log_levels)
  }

  static get(name: string, level: LogLevel = Logger.INFO): Logger {
    if (name.length > 0) {
      let logger = _loggers[name]
      if (logger == null)
        _loggers[name] = logger = new Logger(name, level)
      return logger
    } else
      throw new TypeError("Logger.get() expects a non-empty string name and an optional log-level")
  }

  _name: string
  _log_level: LogLevel

  constructor(name: string, level: LogLevel = Logger.INFO) {
    this._name = name
    this.set_level(level)
  }

  get level(): LogLevel {
    return this.get_level()
  }

  get_level(): LogLevel {
    return this._log_level
  }

  set_level(log_level: LogLevel | string): void {
    if (log_level instanceof LogLevel)
      this._log_level = log_level
    else if (isString(log_level) && Logger.log_levels[log_level] != null)
      this._log_level = Logger.log_levels[log_level]
    else
      throw new Error("Logger.set_level() expects a log-level object or a string name of a log-level")

    const logger_name = `[${this._name}]`

    for (const [name, log_level] of entries(Logger.log_levels)) {
      if (log_level.level < this._log_level.level || this._log_level.level === Logger.OFF.level)
        (this as any)[name] = function() {}
      else
        (this as any)[name] = _method_factory(name, logger_name)
    }
  }

  trace(..._args: unknown[]): void {}

  debug(..._args: unknown[]): void {}

  info(..._args: unknown[]): void {}

  warn(..._args: unknown[]): void {}

  error(..._args: unknown[]): void {}
}

function _method_factory(method_name: string, logger_name: string): (...args: unknown[]) => void  {
  if ((console as any)[method_name] != null)
    return (console as any)[method_name].bind(console, logger_name)
  else if (console.log != null)
    return console.log.bind(console, logger_name)
  else
    return function() {}
}

export const logger = Logger.get("bokeh")

export function set_log_level(level: string | LogLevel): LogLevel {
  const previous_level = logger.level
  if (isString(level) && Logger.log_levels[level] == null) {
    console.log(`[bokeh] unrecognized logging level '${level}' passed to Bokeh.set_log_level(), ignoring`)
    console.log(`[bokeh] valid log levels are: ${Logger.levels.join(', ')}`)
  } else {
    console.log(`[bokeh] setting log level to: '${isString(level) ? level : level.level}'`)
    logger.set_level(level)
  }
  return previous_level
}

export function with_log_level(level: string | LogLevel, fn: () => void): void {
  const original = set_log_level(level)
  try {
    fn()
  } finally {
    set_log_level(original)
  }
}
