import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import {ContinuousTicker} from "../tickers/continuous_ticker"
import * as p from "core/properties"

export class LinearAxisView extends ContinuousAxisView {
  override model: LinearAxis
}

export namespace LinearAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    ticker: p.Property<ContinuousTicker>
    formatters: p.Property<BasicTickFormatter>
  }
}

export interface LinearAxis extends LinearAxis.Attrs {}

export class LinearAxis extends ContinuousAxis {
  override properties: LinearAxis.Props
  override __view_type__: LinearAxisView

  override ticker: ContinuousTicker
  formatters: BasicTickFormatter    // XXX: no override, a TS bug?

  constructor(attrs?: Partial<LinearAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LinearAxisView

    this.override<LinearAxis.Props>({
      ticker:    () => new BasicTicker(),
      formatter: () => new BasicTickFormatter(),
    })
  }
}
