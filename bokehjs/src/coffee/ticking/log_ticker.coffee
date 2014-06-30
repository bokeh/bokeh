
define [
  "ticking/adaptive_ticker",
], (AdaptiveTicker) ->

  range = (start, stop, step) ->
    if typeof stop is "undefined"
    
    # one param defined
      stop = start
      start = 0
    step = 1  if typeof step is "undefined"
    return []  if (step > 0 and start >= stop) or (step < 0 and start <= stop)
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
      
      if data_low > data_high
        [data_low, data_high] = [data_high, data_low]

      if data_low <= 0 #Hotfix
        data_low = 1

      log_low = Math.log(data_low) / Math.log(10)
      log_high = Math.log(data_high) / Math.log(10)
      log_interval = log_high - log_low

      if log_interval < 1
        interval = @get_interval(data_low, data_high, desired_n_ticks)
        start_factor = Math.floor(data_low / interval)
        end_factor   = Math.ceil(data_high / interval)
        if _.isNaN(start_factor) or _.isNaN(end_factor)
          factors = []
        else
          factors = _.range(start_factor, end_factor + 1)

        ticks = (factor * interval for factor in factors when factor != 0)
    
        return ticks

      else
        startlog = Math.ceil(log_low)
        endlog = Math.floor(log_high)
        interval = Math.ceil((endlog - startlog) / 9.0)
        
        expticks = range(startlog, endlog, interval)

        if (endlog - startlog) % interval == 0
          expticks = expticks.concat [endlog]

        expticks = expticks.map (i) -> Math.pow(10, i)
        
        return expticks

    defaults: () ->
      return _.extend(super(), {
        mantissas: [1, 5]
      })

  class LogTickers extends Backbone.Collection
    model: LogTicker

  return {
    "Model": LogTicker,
    "Collection": new LogTickers()
  }
