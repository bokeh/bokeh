import {logger} from "core/logging"
import {range} from "core/util/array"
import {AdaptiveTicker} from "./adaptive_ticker"

export class LogTicker extends AdaptiveTicker
  type: 'LogTicker'

  @override {
    mantissas: [1, 5]
  }

  get_ticks_no_defaults: (data_low, data_high, cross_loc, desired_n_ticks) ->
    num_minor_ticks = @num_minor_ticks
    minor_ticks = []

    base = @base

    log_low = Math.log(data_low) / Math.log(base)
    log_high = Math.log(data_high) / Math.log(base)
    log_interval = log_high - log_low

    if not isFinite(log_interval)
      ticks = []

    # treat as linear ticker
    else if log_interval < 2
      interval = @get_interval(data_low, data_high, desired_n_ticks)
      start_factor = Math.floor(data_low / interval)
      end_factor   = Math.ceil(data_high / interval)

      factors = range(start_factor, end_factor + 1)
      ticks = (factor * interval for factor in factors when factor != 0)
      ticks = ticks.filter((tick) -> return data_low <= tick <= data_high)

      if num_minor_ticks > 0 and ticks.length > 0
        minor_interval = interval / num_minor_ticks
        minor_offsets = (i*minor_interval for i in [0...num_minor_ticks])
        for x in minor_offsets[1..minor_offsets.length]
          minor_ticks.push(ticks[0]-x)
        for tick in ticks
          for x in minor_offsets
            minor_ticks.push(tick+x)

    else
      startlog = Math.ceil(log_low * 0.999999)
      endlog = Math.floor(log_high * 1.000001)
      interval = Math.ceil((endlog - startlog) / 9.0)

      ticks = range(startlog, endlog + 1, interval)
      ticks = ticks.map (i) -> Math.pow(base, i)
      ticks = ticks.filter((tick) -> data_low <= tick <= data_high)

      if num_minor_ticks > 0 and ticks.length > 0
        minor_interval = Math.pow(base, interval) / num_minor_ticks
        minor_offsets = (i*minor_interval for i in [1..num_minor_ticks])
        for x in minor_offsets
          minor_ticks.push(ticks[0] / x)
        minor_ticks.push(ticks[0])
        for tick in ticks
          for x in minor_offsets
            minor_ticks.push(tick * x)

    return {
      major: ticks
      minor: minor_ticks
    }
