import {range} from "core/util/array"
import {isStrictNaN} from "core/util/types"
import {AdaptiveTicker} from "./adaptive_ticker"

export class LogTicker extends AdaptiveTicker
  type: 'LogTicker'

  @override {
    mantissas: [1, 5]
  }

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->

    num_minor_ticks = @num_minor_ticks
    minor_ticks = []

    base = @base

    log_low = Math.log(data_low) / Math.log(base)
    log_high = Math.log(data_high) / Math.log(base)
    log_interval = log_high - log_low

    if log_interval < 2
      interval = @get_interval(data_low, data_high, desired_n_ticks)
      start_factor = Math.floor(data_low / interval)
      end_factor   = Math.ceil(data_high / interval)

      if isStrictNaN(start_factor) or isStrictNaN(end_factor)
        factors = []
      else
        factors = range(start_factor, end_factor + 1)

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
