# This is based on https://github.com/pimterry/loglevel

_ = require 'underscore'

noop = () ->

_method_factory = (method_name, logger_name) ->
  if console[method_name]?
    return console[method_name].bind(console, logger_name)
  else if console.log?
    return console.log.bind(console, logger_name)
  else
    return noop

_loggers = {}

class LogLevel

  constructor: (name, level) ->
    @name = name
    @level = level

class Logger

  @TRACE: new LogLevel("trace", 0)
  @DEBUG: new LogLevel("debug", 1)
  @INFO:  new LogLevel("info",  2)
  @WARN:  new LogLevel("warn",  6)
  @ERROR: new LogLevel("error", 7)
  @FATAL: new LogLevel("fatal", 8)
  @OFF:   new LogLevel("off",   9)

  @log_levels: {
    trace: @TRACE
    debug: @DEBUG
    info:  @INFO
    warn:  @WARN
    error: @ERROR
    fatal: @FATAL
    off:   @OFF
  }

  Object.defineProperty(this, 'levels', { get: () -> Object.keys(Logger.log_levels) })

  @get: (name, level=Logger.INFO) ->
    if _.isString(name) and name.length > 0
      logger = _loggers[name]
      if not logger?
        logger = _loggers[name] = new Logger(name, level)
      return logger
    else
      throw new TypeError("Logger.get() expects a string name and an optional log-level")

  constructor: (name, level=Logger.INFO) ->
    @_name = name
    @set_level(level)

  Object.defineProperty(this.prototype, 'level', { get: () -> @get_level() })

  get_level: () -> @_log_level

  set_level: (log_level) ->
    if log_level instanceof LogLevel
      @_log_level = log_level
    else if _.isString(log_level) and Logger.log_levels[log_level]?
      @_log_level = Logger.log_levels[log_level]
    else
      throw new Error("Logger.set_level() expects a log-level object or a string name of a log-level")

    logger_name = "[#{@_name}]"

    for __, log_level of Logger.log_levels
      if log_level == Logger.OFF
        break
      else
        method_name = log_level.name

        if log_level.level < @_log_level.level
          @[method_name] = noop
        else
          @[method_name] = _method_factory(method_name, logger_name)

logger = Logger.get("bokeh")

set_log_level = (level) ->
  if level not in Logger.levels
    console.log("[bokeh] unrecognized logging level '#{level}' passed to Bokeh.set_log_level(), ignoring")
    console.log("[bokeh] valid log levels are: #{Logger.levels.join(', ')}")
  else
    console.log("[bokeh] setting log level to: '#{level}'")
    logger.set_level(level)

module.exports = {
  Logger: Logger
  logger: logger
  set_log_level: set_log_level
}
