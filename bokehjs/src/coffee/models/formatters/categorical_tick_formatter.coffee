TickFormatter = require "../formatters/tick_formatter"

class CategoricalTickFormatter extends TickFormatter.Model
  type: 'CategoricalTickFormatter'

  doFormat: (ticks) ->
    return ticks

module.exports =
  Model: CategoricalTickFormatter
