define [
  "underscore",
  "numeral"
  "common/collection",
  "common/has_properties"
], (_, Numeral, Collection, HasProperties) ->

  class NumeralTickFormatter extends HasProperties
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

    defaults: ->
      return _.extend {}, super(), {
        format: '0,0'
        language: 'en'
        rounding: 'round'
      }

  class NumeralTickFormatters extends Collection
    model: NumeralTickFormatter

  return {
    Model: NumeralTickFormatter,
    Collection: new NumeralTickFormatters()
  }
