import {ContinuousTicker} from "./continuous_ticker"
import type * as p from "core/properties"

// The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
// regardless of the input range.  It's not very useful by itself, but can
// be used as part of a CompositeTicker below.

export namespace BaseSingleIntervalTicker {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ContinuousTicker.Props
}

export interface BaseSingleIntervalTicker extends BaseSingleIntervalTicker.Attrs {}

export abstract class BaseSingleIntervalTicker extends ContinuousTicker {
  declare properties: BaseSingleIntervalTicker.Props

  constructor(attrs?: Partial<BaseSingleIntervalTicker.Attrs>) {
    super(attrs)
  }

  abstract interval: number

  get_interval(_data_low: number, _data_high: number, _n_desired_ticks: number): number {
    return this.interval
  }

  get_min_interval(): number {
    return this.interval
  }

  get_max_interval(): number {
    return this.interval
  }
}

export namespace SingleIntervalTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseSingleIntervalTicker.Props & {
    interval: p.Property<number>
  }
}

export interface SingleIntervalTicker extends SingleIntervalTicker.Attrs {}

export class SingleIntervalTicker extends BaseSingleIntervalTicker {
  declare properties: SingleIntervalTicker.Props

  constructor(attrs?: Partial<SingleIntervalTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SingleIntervalTicker.Props>(({Float}) => ({
      interval: [ Float ],
    }))
  }

  interval: number
}
