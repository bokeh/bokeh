import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"
import * as p from "core/properties"

export class LinearAxisView extends AxisView {
  model: LinearAxis
}

export namespace LinearAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    ticker: p.Property<BasicTicker>
    formatters: p.Property<BasicTickFormatter>
  }
}

export interface LinearAxis extends LinearAxis.Attrs {}

export class LinearAxis extends ContinuousAxis {
  properties: LinearAxis.Props
  __view_type__: LinearAxisView

  ticker: BasicTicker
  formatters: BasicTickFormatter

  constructor(attrs?: Partial<LinearAxis.Attrs>) {
    super(attrs)
  }

  static init_LinearAxis(): void {
    this.prototype.default_view = LinearAxisView

    this.override({
      ticker:    () => new BasicTicker(),
      formatter: () => new BasicTickFormatter(),
    })
  }
}
