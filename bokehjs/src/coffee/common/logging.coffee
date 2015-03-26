{JL} = require "jsnlog"

logger = JL("Bokeh")
logger.setOptions({
  "appenders": [JL.createConsoleAppender('consoleAppender')],
})

set_log_level = (level) ->
  valid_levels = {
    "trace" : JL.getTraceLevel()
    "debug" : JL.getDebugLevel()
    "info"  : JL.getInfoLevel()
    "warn"  : JL.getWarnLevel()
    "error" : JL.getErrorLevel()
    "fatal" : JL.getFatalLevel()
  }
  if level not of valid_levels
    console.log "Bokeh: Unrecognized logging level '#{level}' passed to
                 Bokeh.set_log_level, ignoring."
    console.log "Bokeh: Valid log levels are: #{Object.keys(valid_levels)}"
    return
  console.log "Bokeh: setting log level to: '#{level}'"
  logger.setOptions({"level": valid_levels[level]})

module.exports =
  logger: logger
  set_log_level: set_log_level
