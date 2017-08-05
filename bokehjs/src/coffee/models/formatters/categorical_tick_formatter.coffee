import {TickFormatter} from "./tick_formatter"

export class CategoricalTickFormatter extends TickFormatter
  type: 'CategoricalTickFormatter'

  doFormat: (ticks, axis) ->
    return ticks
