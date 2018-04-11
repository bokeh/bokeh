import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

// The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
// regardless of the input range.  It's not very useful by itself, but can
// be used as part of a CompositeTicker below.

export namespace SingleIntervalTicker {
  export interface Attrs extends ContinuousTicker.Attrs {
    interval: number
  }

  export interface Props extends ContinuousTicker.Props {}
}

export interface SingleIntervalTicker extends SingleIntervalTicker.Attrs {}

export class SingleIntervalTicker extends ContinuousTicker {

  properties: SingleIntervalTicker.Props

  constructor(attrs?: Partial<SingleIntervalTicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "SingleIntervalTicker"

    this.define({
      interval: [ p.Number ],
    })
  }

  get_interval(_data_low: number, _data_high: number, _n_desired_ticks: number): number {
    return this.interval
  }

  get min_interval(): number {
    return this.interval
  }

  get max_interval(): number {
    return this.interval
  }
}

SingleIntervalTicker.initClass()
