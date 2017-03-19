import * as SPrintf from "sprintf"

import {TickFormatter} from "./tick_formatter"
import * as p from "core/properties"

export class PrintfTickFormatter extends TickFormatter
  type: 'PrintfTickFormatter'

  @define {
      format: [ p.String, '%s' ]
    }

  doFormat: (ticks) ->
    format = @format
    labels = ( SPrintf.sprintf(format, tick) for tick in ticks )
    return labels
