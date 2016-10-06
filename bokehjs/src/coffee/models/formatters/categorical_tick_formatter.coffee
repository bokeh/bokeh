import * as TickFormatter from "../formatters/tick_formatter"

class CategoricalTickFormatter extends TickFormatter.Model
  type: 'CategoricalTickFormatter'

  doFormat: (ticks) ->
    return ticks

export {
  CategoricalTickFormatter as Model
}
