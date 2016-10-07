import {TickFormatter} from "../formatters/tick_formatter"

export class CategoricalTickFormatter extends TickFormatter
  type: 'CategoricalTickFormatter'

  doFormat: (ticks) ->
    return ticks
