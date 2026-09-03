import type {TickSpec} from "./ticker"
import {BasicTicker} from "./basic_ticker"
import {ContinuousTicker} from "./continuous_ticker"
import type * as p from "core/properties"

export namespace ScaledTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousTicker.Props & {
    scale: p.Property<number>
    ticker: p.Property<ContinuousTicker>
  }
}

export interface ScaledTicker extends ScaledTicker.Attrs {}

export class ScaledTicker extends ContinuousTicker {
  declare properties: ScaledTicker.Props

  static {
    this.define<ScaledTicker.Props>(({Float, Positive, Ref}) => ({
      scale:  [ Positive(Float), 1.0 ],
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
    const {scale} = this
    return scale*this.ticker.get_interval(data_low/scale, data_high/scale, desired_n_ticks)
  }

  override get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: number, desired_n_ticks: number, num_minor_ticks: number): TickSpec<number> {
    const {scale} = this
    const ticks = this.ticker.get_ticks_no_defaults(
      data_low/scale,
      data_high/scale,
      cross_loc,
      desired_n_ticks,
      num_minor_ticks,
    )

    return {
      major: ticks.major.map((tick) => scale*tick),
      minor: ticks.minor.map((tick) => scale*tick),
    }
  }
}
