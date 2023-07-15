import {Model} from "../../model"
import type {Range} from "../ranges/range"
import type * as p from "core/properties"

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

export namespace Ticker{
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface Ticker extends Ticker.Attrs {}

export abstract class Ticker extends Model {
  declare properties: Ticker.Props

  constructor(attrs?: Partial<Ticker.Attrs>) {
    super(attrs)
  }

  // Generates a nice series of ticks for a given range.
  // TODO: any -> unknown or number | Factor
  abstract get_ticks(data_low: number, data_high: number, range: Range, cross_loc: number): TickSpec<any>
}
