import {TickSpec} from "./ticker"
import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

export namespace FixedTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousTicker.Props & {
    ticks: p.Property<number[]>
    minor_ticks: p.Property<number[]>
  }
}

export interface FixedTicker extends FixedTicker.Attrs {}

export class FixedTicker extends ContinuousTicker {
  properties: FixedTicker.Props

  constructor(attrs?: Partial<FixedTicker.Attrs>) {
    super(attrs)
  }

  static init_FixedTicker(): void {
    this.define<FixedTicker.Props>({
      ticks: [ p.Array, [] ],
      minor_ticks: [ p.Array, [] ],
    })
  }

  get_ticks_no_defaults(_data_low: number, _data_high: number, _cross_loc: any, _desired_n_ticks: number): TickSpec<number> {
    return {
      major: this.ticks,
      minor: this.minor_ticks,
    }
  }

  // XXX: whatever, because FixedTicker needs to fulfill the interface somehow
  get_interval(_data_low: number, _data_high: number, _desired_n_ticks: number): number {
    return 0
  }

  min_interval: number = 0
  max_interval: number = 0
  //
}
