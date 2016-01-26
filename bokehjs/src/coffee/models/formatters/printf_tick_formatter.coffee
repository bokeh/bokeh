_ = require "underscore"
SPrintf = require "sprintf"
TickFormatter = require "./tick_formatter"

class PrintfTickFormatter extends TickFormatter.Model
  type: 'PrintfTickFormatter'

  format: (ticks) ->
    format = @get("format")
    labels = ( SPrintf.sprintf(format, tick) for tick in ticks )
    return labels

  defaults: () ->
    return _.extend {}, super(), {
      format: '%s'
    }

module.exports =
  Model: PrintfTickFormatter