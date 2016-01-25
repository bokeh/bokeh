TickFormatter = require "./tick_formatter"

class CategoricalTickFormatter extends TickFormatter.Model
  type: 'CategoricalTickFormatter'

  format: (ticks) ->
    return ticks

module.exports =
  Model: CategoricalTickFormatter

