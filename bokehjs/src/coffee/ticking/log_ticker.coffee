define [
  "underscore",
  "common/collection",
  "ticking/adaptive_ticker",
], (_, Collection, AdaptiveTicker) ->

  range = (start, stop, step) ->
    if _.isUndefined(stop) # one param defined
      stop = start
      start = 0
    step = 1 if _.isUndefined(step)
    return [] if (step > 0 and start >= stop) or (step < 0 and start <= stop)
    result = []
    i = start

    while (if step > 0 then i < stop else i > stop)
      result.push i
      i += step
    return result

  class LogTicker extends AdaptiveTicker.Model
    type: 'LogTicker'

    initialize: (attrs, options) ->
      super(attrs, options)

    get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->

      num_minor_ticks = @get('num_minor_ticks')
      minor_ticks = []

      if data_low <= 0 #Hotfix
        data_low = 1

      if data_low > data_high
        [data_low, data_high] = [data_high, data_low]

      base = @get('base')

      log_low = Math.log(data_low) / Math.log(base)
      log_high = Math.log(data_high) / Math.log(base)
      log_interval = log_high - log_low

      if log_interval < 2
        interval = @get_interval(data_low, data_high, desired_n_ticks)
        start_factor = Math.floor(data_low / interval)
        end_factor   = Math.ceil(data_high / interval)

        if _.isNaN(start_factor) or _.isNaN(end_factor)
          factors = []
        else
          factors = _.range(start_factor, end_factor + 1)

        ticks = (factor * interval for factor in factors when factor != 0)

        if num_minor_ticks > 1
          minor_interval = interval / num_minor_ticks
          minor_offsets = (i*minor_interval for i in [1..num_minor_ticks])
          for x in minor_offsets
            minor_ticks.push(ticks[0]-x)
          for tick in ticks
            for x in minor_offsets
              minor_ticks.push(tick+x)
      else
        startlog = Math.ceil(log_low)
        endlog = Math.floor(log_high)
        interval = Math.ceil((endlog - startlog) / 9.0)

        ticks = range(startlog, endlog, interval)

        if (endlog - startlog) % interval == 0
          ticks = ticks.concat [endlog]

        ticks = ticks.map (i) -> Math.pow(base, i)

        if num_minor_ticks > 1
          minor_interval = Math.pow(base, interval) / num_minor_ticks
          minor_offsets = (i*minor_interval for i in [1..num_minor_ticks])
          for x in minor_offsets
            minor_ticks.push(ticks[0] / x)
          for tick in ticks
            for x in minor_offsets
              minor_ticks.push(tick * x)

      return {
        "major": ticks
        "minor": minor_ticks
      }

    defaults: ->
      return _.extend {}, super(), {
        mantissas: [1, 5]
      }

  class LogTickers extends Collection
    model: LogTicker

  return {
    "Model": LogTicker,
    "Collection": new LogTickers()
  }
