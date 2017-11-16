import {Model} from "../../model"
import {Range} from "../ranges/range"

export type TickSpec<T> = {
  major: T[]
  minor: T[]
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
export abstract class Ticker<T, R extends Range> extends Model {
  // Generates a nice series of ticks for a given range.
  abstract get_ticks(data_low: number, data_high: number, range: R, cross_loc: any, unused: any): TickSpec<T>
}

Ticker.prototype.type = "Ticker"
