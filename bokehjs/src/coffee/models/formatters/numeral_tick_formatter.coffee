_ = require "underscore"
Numbro = require "numbro"

TickFormatter = require "./tick_formatter"
p = require "../../core/properties"

class NumeralTickFormatter extends TickFormatter.Model
  type: 'NumeralTickFormatter'

  @define {
      # TODO (bev) all of these could be tightened up
      format:   [ p.String, '0,0'   ]
      language: [ p.String, 'en'    ]
      rounding: [ p.String, 'round' ]
    }

  doFormat: (ticks) ->
    format = @get("format")
    language = @get("language")
    rounding = switch @get("rounding")
      when "round", "nearest"   then Math.round
      when "floor", "rounddown" then Math.floor
      when "ceil",  "roundup"   then Math.ceil

    labels = ( Numbro.format(tick, format, language, rounding) for tick in ticks )
    return labels


module.exports =
  Model: NumeralTickFormatter
