import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

// The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
// regardless of the input range.  It's not very useful by itself, but can
// be used as part of a CompositeTicker below.

export namespace SingleIntervalTicker {
  export interface Attrs extends ContinuousTicker.Attrs {
    interval: number
  }

  export interface Opts extends ContinuousTicker.Opts {}
}

export interface SingleIntervalTicker extends SingleIntervalTicker.Attrs {}

export class SingleIntervalTicker extends ContinuousTicker {

  static initClass() {
    this.prototype.type = "SingleIntervalTicker"

    this.define({
      interval: [ p.Number ],
    })
  }

  get_interval(_data_low: number, _data_high: number, _n_desired_ticks: number) {
    return this.interval
  }

  get min_interval() {
    return this.interval
  }

  get max_interval() {
    return this.interval
  }
}

SingleIntervalTicker.initClass()
