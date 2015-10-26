_ = require "underscore"
Numbro = require "numbro"
HasProperties = require "../common/has_properties"

class NumeralTickFormatter extends HasProperties
  type: 'NumeralTickFormatter'

  format: (ticks) ->
    format = @get("format")
    language = @get("language")
    rounding = switch @get("rounding")
      when "round", "nearest"   then Math.round
      when "floor", "rounddown" then Math.floor
      when "ceil",  "roundup"   then Math.ceil

    labels = ( Numbro.format(tick, format, language, rounding) for tick in ticks )
    return labels

  defaults: () ->
    return _.extend {}, super(), {
      format: '0,0'
      language: 'en'
      rounding: 'round'
    }

module.exports =
  Model: NumeralTickFormatter
