import type {TickSpec} from "./ticker"
import {BasicTicker} from "./basic_ticker"
import {ContinuousTicker} from "./continuous_ticker"
import type * as p from "core/properties"

export namespace UnitTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousTicker.Props & {
    scale: p.Property<number>
    offset: p.Property<number>
    ticker: p.Property<ContinuousTicker>
  }
}

export interface UnitTicker extends UnitTicker.Attrs {}

export class UnitTicker extends ContinuousTicker {
  declare properties: UnitTicker.Props

  static {
    this.define<UnitTicker.Props>(({Float, Positive, Ref}) => ({
      scale:  [ Positive(Float), 1.0 ],
      offset: [ Float, 0.0 ],
      ticker: [ Ref(ContinuousTicker), () => BasicTicker.create() ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    const emit_changed = () => this.change.emit()
    let ticker = this.ticker
    this.connect(ticker.change, emit_changed)

    this.on_change(this.properties.ticker, () => {
      this.disconnect(ticker.change, emit_changed)
      ticker = this.ticker
      this.connect(ticker.change, emit_changed)
    })
  }

  get_min_interval(): number {
    return this.scale*this.ticker.get_min_interval()
  }

  get_max_interval(): number {
    return this.scale*this.ticker.get_max_interval()
  }

  get_interval(data_low: number, data_high: number, desired_n_ticks: number): number {
    const {scale, offset} = this
    return scale*this.ticker.get_interval((data_low - offset)/scale, (data_high - offset)/scale, desired_n_ticks)
  }

  override get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: number, desired_n_ticks: number, num_minor_ticks: number): TickSpec<number> {
    const {scale, offset} = this
    const ticks = this.ticker.get_ticks_no_defaults(
      (data_low - offset)/scale,
      (data_high - offset)/scale,
      cross_loc,
      desired_n_ticks,
      num_minor_ticks,
    )

    return {
      major: ticks.major.map((tick) => offset + scale*tick),
      minor: ticks.minor.map((tick) => offset + scale*tick),
    }
  }
}
