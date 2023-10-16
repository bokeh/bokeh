import type {TickSpec} from "./ticker"
import {Ticker} from "./ticker"
import type {Range} from "../ranges/range"
import type * as p from "core/properties"
import {range} from "core/util/array"

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

export namespace ContinuousTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Ticker.Props & {
    num_minor_ticks: p.Property<number>
    desired_num_ticks: p.Property<number>
  }
}

export interface ContinuousTicker extends ContinuousTicker.Attrs {}

export abstract class ContinuousTicker extends Ticker {
  declare properties: ContinuousTicker.Props

  constructor(attrs?: Partial<ContinuousTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ContinuousTicker.Props>(({Int}) => ({
      num_minor_ticks:   [ Int, 5 ],
      desired_num_ticks: [ Int, 6 ],
    }))
  }

  get_ticks(data_low: number, data_high: number, _range: Range, cross_loc: number): TickSpec<number> {
    return this.get_ticks_no_defaults(data_low, data_high, cross_loc, this.desired_num_ticks)
  }

  // Given min and max values and a number of ticks, returns a tick interval
  // that produces approximately the right number of nice ticks.  (If you just
  // implement this method, get_ticks_no_defaults() will work.  However, if
  // you want to return ticks that aren't evenly spaced, you'll need to
  // override get_ticks_no_defaults() directly.  In that case, you should
  // still implement get_interval(), because users can call it to get a sense
  // of what the spacing will be for a given range.)
  // FIXME Is that necessary?  Maybe users should just call get_ticks() and
  // figure it out from that.
  abstract get_interval(data_low: number, data_high: number, desired_n_ticks: number): number

  // The version of get_ticks() that does the work (and the version that
  // should be overridden in subclasses).
  get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: number, desired_n_ticks: number): TickSpec<number> {
    const interval = this.get_interval(data_low, data_high, desired_n_ticks)
    const start_factor = Math.floor(data_low / interval)
    const end_factor   = Math.ceil(data_high / interval)
    let factors: number[]
    if (!isFinite(start_factor) || !isFinite(end_factor)) {
      factors = []
    } else {
      factors = range(start_factor, end_factor + 1)
    }
    const ticks = factors
      .map((factor) => factor*interval)
      .filter((tick) => data_low <= tick && tick <= data_high)
    const num_minor_ticks = this.num_minor_ticks
    const minor_ticks = []
    if (num_minor_ticks > 0 && ticks.length > 0) {
      const minor_interval = interval / num_minor_ticks
      const minor_offsets = range(0, num_minor_ticks).map((i) => i*minor_interval)
      for (const x of minor_offsets.slice(1)) {
        const mt = ticks[0] - x
        if (data_low <= mt && mt <= data_high) {
          minor_ticks.push(mt)
        }
      }
      for (const tick of ticks) {
        for (const x of minor_offsets) {
          const mt = tick + x
          if (data_low <= mt && mt <= data_high) {
            minor_ticks.push(mt)
          }
        }
      }
    }
    return {
      major: ticks,
      minor: minor_ticks,
    }
  }

  // Returns the smallest interval that can be returned by get_interval().
  abstract get_min_interval(): number

  // Returns the largest interval that can be returned by get_interval().
  abstract get_max_interval(): number

  // Returns the interval size that would produce exactly the number of
  // desired ticks.  (In general we won't use exactly this interval, because
  // we want the ticks to be round numbers.)
  get_ideal_interval(data_low: number, data_high: number, desired_n_ticks: number): number {
    const data_range = data_high - data_low
    return data_range / desired_n_ticks
  }
}
