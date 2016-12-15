import * as _ from "underscore"

import {ContinuousTicker} from "./continuous_ticker"
import {argmin} from "./util"
import * as p from "../../core/properties"

# This Ticker takes a collection of Tickers and picks the one most appropriate
# for a given range.
export class CompositeTicker extends ContinuousTicker
  type: 'CompositeTicker'

  @define {
      tickers: [p.Array, [] ]
    }

  # The tickers should be in order of increasing interval size; specifically,
  # if S comes before T, then it should be the case that
  # S.get_max_interval() < T.get_min_interval().
  # FIXME Enforce this automatically.

  @getters {
    min_intervals: () -> (ticker.get_min_interval() for ticker in @tickers)
    max_intervals: () -> (ticker.get_max_interval() for ticker in @tickers)
    min_interval: () -> _.first(@min_intervals)
    max_interval: () -> _.first(@max_intervals)
  }

  get_best_ticker: (data_low, data_high, desired_n_ticks) ->
    data_range = data_high - data_low
    ideal_interval = @get_ideal_interval(data_low, data_high,
                                         desired_n_ticks)
    ticker_ndxs = [
      _.sortedIndex(@min_intervals, ideal_interval) - 1,
      _.sortedIndex(@max_intervals, ideal_interval)
    ]
    intervals = [@min_intervals[ticker_ndxs[0]],
                 @max_intervals[ticker_ndxs[1]]]
    errors = intervals.map((interval) ->
      return Math.abs(desired_n_ticks - (data_range / interval)))

    # this can happen if the data isn't loaded yet, we just default to
    # the first scale
    best_index = argmin(errors)
    if best_index == Infinity
      return @tickers[0]
    best_ticker_ndx = ticker_ndxs[best_index]
    best_ticker = @tickers[best_ticker_ndx]

    return best_ticker

  get_interval: (data_low, data_high, desired_n_ticks) ->
    best_ticker = @get_best_ticker(data_low, data_high, desired_n_ticks)
    return best_ticker.get_interval(data_low, data_high, desired_n_ticks)

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    best_ticker = @get_best_ticker(data_low, data_high, desired_n_ticks)
    ticks = best_ticker.get_ticks_no_defaults(data_low, data_high, desired_n_ticks)
    return ticks
