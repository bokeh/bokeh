import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

export class FixedTicker extends ContinuousTicker {

  ticks: number[]

  get_ticks_no_defaults(_data_low: number, _data_high: number, _cross_loc: any, _desired_n_ticks: number) {
    return {
      major: this.ticks,
      minor: [],
    }
  }

  // XXX: whatever, because FixedTicker needs to fullfill the interface somehow
  get_interval(_data_low: number, _data_high: number, _desired_n_ticks: number): number {
    return 0
  }

  min_interval: number = 0
  max_interval: number = 0
  //
}

FixedTicker.prototype.type = "FixedTicker"

FixedTicker.define({
  ticks: [ p.Array, [] ],
})
