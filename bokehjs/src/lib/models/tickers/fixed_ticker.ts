import {TickSpec} from "./ticker"
import {ContinuousTicker} from "./continuous_ticker"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace FixedTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousTicker.Props & {
    ticks: p.Property<Arrayable<number>>
    minor_ticks: p.Property<Arrayable<number>>
  }
}

export interface FixedTicker extends FixedTicker.Attrs {}

export class FixedTicker extends ContinuousTicker {
  override properties: FixedTicker.Props

  constructor(attrs?: Partial<FixedTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<FixedTicker.Props>(({Number, Arrayable}) => ({
      ticks: [ Arrayable(Number), [] ],
      minor_ticks: [ Arrayable(Number), [] ],
    }))
  }

  override get_ticks_no_defaults(_data_low: number, _data_high: number, _cross_loc: number, _desired_n_ticks: number): TickSpec<number> {
    return {
      major: [...this.ticks],
      minor: [...this.minor_ticks],
    }
  }

  // XXX: whatever, because FixedTicker needs to fulfill the interface somehow
  get_interval(_data_low: number, _data_high: number, _desired_n_ticks: number): number {
    return 0
  }

  get_min_interval(): number {
    return 0
  }

  get_max_interval(): number {
    return 0
  }
  //
}
