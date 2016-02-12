_ = require "underscore"
Numeral = require "numeral"
TickFormatter = require "./tick_formatter"

class NumeralTickFormatter extends TickFormatter.Model
  type: 'NumeralTickFormatter'

  format: (ticks) ->
    format = @get("format")
    language = @get("language")
    rounding = switch @get("rounding")
      when "round", "nearest"   then Math.round
      when "floor", "rounddown" then Math.floor
      when "ceil",  "roundup"   then Math.ceil

    labels = ( Numeral.format(tick, format, language, rounding) for tick in ticks )
    return labels

  defaults: () ->
    return _.extend {}, super(), {
      format: '0,0'
      language: 'en'
      rounding: 'round'
    }

module.exports =
  Model: NumeralTickFormatter
