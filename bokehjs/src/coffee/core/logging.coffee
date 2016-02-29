{JL} = require "jsnlog"

logger = JL("Bokeh")
logger.setOptions({
  "appenders": [JL.createConsoleAppender('consoleAppender')],
  "level": JL.getInfoLevel()
})

levels = {
  "trace" : JL.getTraceLevel()
  "debug" : JL.getDebugLevel()
  "info"  : JL.getInfoLevel()
  "warn"  : JL.getWarnLevel()
  "error" : JL.getErrorLevel()
  "fatal" : JL.getFatalLevel()
}

# Set the global logging level for Bokeh JS console output
#
# @param level [string] the log level to set
#
# valid log levels are: trace, debug, info, warn, error, fatal
#
set_log_level = (level) ->
  if level not of levels
    console.log "Bokeh: Unrecognized logging level '#{level}' passed to Bokeh.set_log_level, ignoring."
    console.log "Bokeh: Valid log levels are: #{Object.keys(levels)}"
    return
  console.log "Bokeh: setting log level to: '#{level}'"
  logger.setOptions({"level": levels[level]})
  return null

module.exports =
  levels: levels
  logger: logger
  set_log_level: set_log_level
