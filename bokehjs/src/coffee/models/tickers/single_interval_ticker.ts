import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

// The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
// regardless of the input range.  It's not very useful by itself, but can
// be used as part of a CompositeTicker below.
export class SingleIntervalTicker extends ContinuousTicker {

  interval: number

  get_interval(data_low, data_high, n_desired_ticks) {
    return this.interval
  }

  get min_interval() {
    return this.interval
  }

  get max_interval() {
    return this.interval
  }
}

SingleIntervalTicker.prototype.type = "SingleIntervalTicker"

SingleIntervalTicker.define({
  interval: [ p.Number ],
})
