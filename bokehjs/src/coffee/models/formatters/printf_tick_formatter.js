import {sprintf} from "sprintf-js"

import {TickFormatter} from "./tick_formatter"
import * as p from "core/properties"

export class PrintfTickFormatter extends TickFormatter
  type: 'PrintfTickFormatter'

  @define {
    format: [ p.String, '%s' ]
  }

  doFormat: (ticks, axis) ->
    format = @format
    labels = ( sprintf(format, tick) for tick in ticks )
    return labels
