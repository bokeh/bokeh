// This is based on https://github.com/pimterry/loglevel

import {isString} from "./util/types"
import {values} from "./util/object"
import {version} from "../version"

const _loggers: {[key: string]: Logger} = {}

type LogMethod = "log" | "trace" | "debug" | "info" | "warn" | "error"

export class LogLevel {
  constructor(readonly name: string, readonly level: number, readonly method: LogMethod) {}
}

export class Logger {
  static TRACE = new LogLevel("trace", 0, "trace")
  static DEBUG = new LogLevel("debug", 1, "debug")
  static INFO  = new LogLevel("info",  2, "info")
  static WARN  = new LogLevel("warn",  6, "warn")
  static ERROR = new LogLevel("error", 7, "error")
  static FATAL = new LogLevel("fatal", 8, "error")
  static OFF   = new LogLevel("off",   9, "log")

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
      if (name in _loggers) {
        return _loggers[name]
      } else {
        return _loggers[name] = new Logger(name, level)
      }
    } else {
      throw new TypeError("Logger.get() expects a non-empty string name and an optional log-level")
    }
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
    if (log_level instanceof LogLevel) {
      this._log_level = log_level
    } else if (Logger.log_levels.hasOwnProperty(log_level)) {
      this._log_level = Logger.log_levels[log_level]
    } else {
      throw new Error("Logger.set_level() expects a log-level object or a string name of a log-level")
    }

    const prefix = `[${this._name}]`

    for (const {level, method} of values(Logger.log_levels)) {
      if (level < this._log_level.level || this._log_level.level === Logger.OFF.level) {
        this[method] = function() {}
      } else {
        this[method] = _method_factory(method, prefix)
      }
    }

    this.log = _method_factory("log", prefix)
  }

  log(..._args: unknown[]): void {}

  trace(..._args: unknown[]): void {}

  debug(..._args: unknown[]): void {}

  info(..._args: unknown[]): void {}

  warn(..._args: unknown[]): void {}

  error(..._args: unknown[]): void {}
}

function _method_factory(method_name: LogMethod, prefix: string): (...args: unknown[]) => void  {
  const method = console[method_name]
  const fn = typeof method != "undefined" ? method : console.log
  return fn.bind(console, prefix)
}

export const logger = Logger.get(`bokeh ${version}`)

export function set_log_level(level: string | LogLevel): LogLevel {
  const previous_level = logger.level
  if (isString(level) && !(level in Logger.log_levels)) {
    logger.log(`unrecognized logging level '${level}' passed to Bokeh.set_log_level(), ignoring`)
    logger.log(`valid log levels are: ${Logger.levels.join(", ")}`)
  } else {
    logger.log(`setting log level to: '${isString(level) ? level : level.level}'`)
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
