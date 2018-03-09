import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

export namespace FixedTicker {
  export interface Attrs extends ContinuousTicker.Attrs {
    ticks: number[]
  }

  export interface Props extends ContinuousTicker.Props {}
}

export interface FixedTicker extends FixedTicker.Attrs {}

export class FixedTicker extends ContinuousTicker {

  properties: FixedTicker.Props

  constructor(attrs?: Partial<FixedTicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "FixedTicker"

    this.define({
      ticks: [ p.Array, [] ],
    })
  }

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

FixedTicker.initClass()
