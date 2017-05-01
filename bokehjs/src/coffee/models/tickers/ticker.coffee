import {Model} from "../../model"
import {range} from "core/util/array"
import {isStrictNaN} from "core/util/types"

# The base class for all Ticker objects.  It needs to be subclassed before
# being used.  The simplest subclass is SingleIntervalTicker.
#
# The main value of a Ticker is its get_ticks() method, which takes a min and
# max value and (optionally) a desired number of ticks, and returns an array
# of approximately that many ticks, evenly spaced, with nice round values,
# within that range.
#
# Different Tickers are suited to different types of data or different
# magnitudes.  To make it possible to select Tickers programmatically, they
# also support some additional methods: get_interval(), get_min_interval(),
# and get_max_interval().
export class Ticker extends Model
  type: 'Ticker'

  # Generates a nice series of ticks for a given range.
  get_ticks: (data_low, data_high, range, cross_loc, {desired_n_ticks}) ->
    return @get_ticks_no_defaults(data_low, data_high, cross_loc, @desired_num_ticks)

  # The version of get_ticks() that does the work (and the version that
  # should be overridden in subclasses).
  get_ticks_no_defaults: (data_low, data_high, cross_loc, desired_n_ticks) ->
    interval = @get_interval(data_low, data_high, desired_n_ticks)
    start_factor = Math.floor(data_low / interval)
    end_factor   = Math.ceil(data_high / interval)
    if isStrictNaN(start_factor) or isStrictNaN(end_factor)
      factors = []
    else
      factors = range(start_factor, end_factor + 1)
    ticks = (factor * interval for factor in factors)
    ticks = ticks.filter((tick) -> data_low <= tick <= data_high)
    num_minor_ticks = @num_minor_ticks
    minor_ticks = []
    if num_minor_ticks > 0 and ticks.length > 0
      minor_interval = interval / num_minor_ticks
      minor_offsets = (i*minor_interval for i in [0...num_minor_ticks])
      for x in minor_offsets[1..minor_offsets.length]
        minor_ticks.push(ticks[0]-x)
      for tick in ticks
        for x in minor_offsets
          minor_ticks.push(tick+x)
    return {
      "major": ticks
      "minor": minor_ticks
    }
