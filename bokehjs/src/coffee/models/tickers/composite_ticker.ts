import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"
import {argmin, sortedIndex} from "core/util/array"
import {isEmpty} from "core/util/object"

// This Ticker takes a collection of Tickers and picks the one most appropriate
// for a given range.
export class CompositeTicker extends ContinuousTicker {

  tickers: ContinuousTicker[]

  // The tickers should be in order of increasing interval size; specifically,
  // if S comes before T, then it should be the case that
  // S.get_max_interval() < T.get_min_interval().
  // FIXME Enforce this automatically.

  get min_intervals() { return this.tickers.map((ticker) => ticker.get_min_interval()) }
  get max_intervals() { return this.tickers.map((ticker) => ticker.get_max_interval()) }
  get min_interval() { return this.min_intervals[0] }
  get max_interval() { return this.max_intervals[0] }

  get_best_ticker(data_low: number, data_high: number, desired_n_ticks: number) {
    const data_range = data_high - data_low
    const ideal_interval = this.get_ideal_interval(data_low, data_high, desired_n_ticks)
    const ticker_ndxs = [
      sortedIndex(this.min_intervals, ideal_interval) - 1,
      sortedIndex(this.max_intervals, ideal_interval),
    ]
    const intervals = [
      this.min_intervals[ticker_ndxs[0]],
      this.max_intervals[ticker_ndxs[1]],
    ]
    const errors = intervals.map((interval) => {
      return Math.abs(desired_n_ticks - (data_range / interval))
    })

    let best_ticker

    if (isEmpty(errors.filter((e) => !isNaN(e)))) {
      // this can happen if the data isn't loaded yet, we just default to the first scale
      best_ticker = this.tickers[0]
    } else {
      const best_index = argmin(errors)
      const best_ticker_ndx = ticker_ndxs[best_index]
      best_ticker = this.tickers[best_ticker_ndx]
    }

    return best_ticker
  }

  get_interval(data_low: number, data_high: number, desired_n_ticks: number) {
    const best_ticker = this.get_best_ticker(data_low, data_high, desired_n_ticks)
    return best_ticker.get_interval(data_low, data_high, desired_n_ticks)
  }

  get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: any, desired_n_ticks: number) {
    const best_ticker = this.get_best_ticker(data_low, data_high, desired_n_ticks)
    return best_ticker.get_ticks_no_defaults(data_low, data_high, cross_loc, desired_n_ticks)
  }
}

CompositeTicker.prototype.type = "CompositeTicker"

CompositeTicker.define({
  tickers: [p.Array, [] ],
})
