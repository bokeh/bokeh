import {Ticker} from "./ticker"
import * as p from "core/properties"

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
export class ContinuousTicker extends Ticker
  type: 'ContinuousTicker'

  @define {
      num_minor_ticks:   [ p.Number, 5 ]
      desired_num_ticks: [ p.Number, 6 ]
    }

  # Given min and max values and a number of ticks, returns a tick interval
  # that produces approximately the right number of nice ticks.  (If you just
  # implement this method, get_ticks_no_defaults() will work.  However, if
  # you want to return ticks that aren't evenly spaced, you'll need to
  # override get_ticks_no_defaults() directly.  In that case, you should
  # still implement get_interval(), because users can call it to get a sense
  # of what the spacing will be for a given range.)
  # FIXME Is that necessary?  Maybe users should just call get_ticks() and
  # figure it out from that.
  get_interval: undefined

  # Returns the smallest interval that can be returned by get_interval().
  get_min_interval: () -> @min_interval

  # Returns the largest interval that can be returned by get_interval().
  get_max_interval: () -> @max_interval ? Infinity

  # Returns the interval size that would produce exactly the number of
  # desired ticks.  (In general we won't use exactly this interval, because
  # we want the ticks to be round numbers.)
  get_ideal_interval: (data_low, data_high, desired_n_ticks) ->
    data_range = data_high - data_low
    return data_range / desired_n_ticks
