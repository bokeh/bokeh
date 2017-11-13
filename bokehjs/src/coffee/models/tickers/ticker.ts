import {Model} from "../../model"
import {range} from "core/util/array"
import {isStrictNaN} from "core/util/types"

export type TickSpec = {
  major: number[]
  minor: number[]
}

// The base class for all Ticker objects.  It needs to be subclassed before
// being used.  The simplest subclass is SingleIntervalTicker.
//
// The main value of a Ticker is its get_ticks() method, which takes a min and
// max value and (optionally) a desired number of ticks, and returns an array
// of approximately that many ticks, evenly spaced, with nice round values,
// within that range.
//
// Different Tickers are suited to different types of data or different
// magnitudes.  To make it possible to select Tickers programmatically, they
// also support some additional methods: get_interval(), get_min_interval(),
// and get_max_interval().
export abstract class Ticker extends Model {

  abstract get_interval(data_low: number, data_high: number, desired_n_ticks: number): number

  // Generates a nice series of ticks for a given range.
  get_ticks(data_low: number, data_high: number, _range: any, cross_loc: any, _: any): TickSpec {
    return this.get_ticks_no_defaults(data_low, data_high, cross_loc, this.desired_num_ticks)
  }

  // The version of get_ticks() that does the work (and the version that
  // should be overridden in subclasses).
  get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: any, desired_n_ticks: number): TickSpec {
    const interval = this.get_interval(data_low, data_high, desired_n_ticks)
    const start_factor = Math.floor(data_low / interval)
    const end_factor   = Math.ceil(data_high / interval)
    let factors: number[]
    if (isStrictNaN(start_factor) || isStrictNaN(end_factor))
      factors = []
    else
      factors = range(start_factor, end_factor + 1)
    const ticks =
      factors.map((factor) => factor*interval)
             .filter((tick) => data_low <= tick && tick <= data_high)
    const num_minor_ticks = this.num_minor_ticks
    const minor_ticks = []
    if (num_minor_ticks > 0 && ticks.length > 0) {
      const minor_interval = interval / num_minor_ticks
      const minor_offsets = range(0, num_minor_ticks).map((i) => i*minor_interval)
      for (const x of minor_offsets.slice(1)) {
        minor_ticks.push(ticks[0] - x)
      }
      for (const tick of ticks) {
        for (const x of minor_offsets) {
          minor_ticks.push(tick + x)
        }
      }
    }
    return {
      major: ticks,
      minor: minor_ticks,
    }
  }
}

Ticker.prototype.type = "Ticker"
