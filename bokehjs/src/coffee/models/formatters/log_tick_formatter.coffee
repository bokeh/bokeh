import {BasicTickFormatter} from "./basic_tick_formatter"
import {TickFormatter} from "./tick_formatter"
import {logger} from "core/logging"
import * as p from "core/properties"

export class LogTickFormatter extends TickFormatter
  type: 'LogTickFormatter'

  @define {
      ticker: [ p.Instance, null ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @basic_formatter = new BasicTickFormatter()
    if not @ticker?
      logger.warn("LogTickFormatter not configured with a ticker, using default base of 10 (labels will be incorrect if ticker base is not 10)")

  doFormat: (ticks) ->
    if ticks.length == 0
      return []

    if @ticker?
      base = @ticker.base
    else
      base = 10

    small_interval = false
    labels = new Array(ticks.length)
    for i in [0...ticks.length]
      labels[i] = "#{base}^#{ Math.round(Math.log(ticks[i]) / Math.log(base)) }"
      if (i > 0) and (labels[i] == labels[i-1])
        small_interval = true
        break

    if small_interval
      labels = @basic_formatter.doFormat(ticks)

    return labels
