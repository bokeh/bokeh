import * as _ from "underscore"
import * as SPrintf from "sprintf"

import * as TickFormatter from "./tick_formatter"
import * as p from "../../core/properties"

class PrintfTickFormatter extends TickFormatter.Model
  type: 'PrintfTickFormatter'

  @define {
      format: [ p.String, '%s' ]
    }

  doFormat: (ticks) ->
    format = @format
    labels = ( SPrintf.sprintf(format, tick) for tick in ticks )
    return labels

module.exports =
  Model: PrintfTickFormatter
