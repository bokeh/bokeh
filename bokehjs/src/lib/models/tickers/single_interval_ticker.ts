import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

// The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
// regardless of the input range.  It's not very useful by itself, but can
// be used as part of a CompositeTicker below.

export namespace SingleIntervalTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousTicker.Props & {
    interval: p.Property<number>
  }
}

export interface SingleIntervalTicker extends SingleIntervalTicker.Attrs {}

export class SingleIntervalTicker extends ContinuousTicker {
  override properties: SingleIntervalTicker.Props

  constructor(attrs?: Partial<SingleIntervalTicker.Attrs>) {
    super(attrs)
  }

  static init_SingleIntervalTicker(): void {
    this.define<SingleIntervalTicker.Props>(({Number}) => ({
      interval: [ Number ],
    }))
  }

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
