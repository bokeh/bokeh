import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import type {ContinuousTicker} from "../tickers/continuous_ticker"
import type * as p from "core/properties"

export class LinearAxisView extends ContinuousAxisView {
  declare model: LinearAxis
}

export namespace LinearAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    //ticker: p.Property<ContinuousTicker>
    //formatters: p.Property<BasicTickFormatter>
  }
}

export interface LinearAxis extends LinearAxis.Attrs {}

export class LinearAxis extends ContinuousAxis {
  declare properties: LinearAxis.Props
  declare __view_type__: LinearAxisView

  declare ticker: ContinuousTicker
  declare formatter: BasicTickFormatter

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
