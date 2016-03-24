_ = require "underscore"

BasicTickFormatter = require "./basic_tick_formatter"
TickFormatter = require "./tick_formatter"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class LogTickFormatter extends TickFormatter.Model
  type: 'LogTickFormatter'

  @define {
      ticker: [ p.Instance, null ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @basic_formatter = new BasicTickFormatter.Model()
    if not @get('ticker')?
      logger.warn("LogTickFormatter not configured with a ticker, using default base of 10 (labels will be incorrect if ticker base is not 10)")

  doFormat: (ticks) ->
    if ticks.length == 0
      return []

    if @get('ticker')?
      base = @get('ticker').get('base')
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

module.exports =
  Model: LogTickFormatter
