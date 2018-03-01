import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"

export class LinearAxisView extends AxisView {
  model: LinearAxis
}

export namespace LinearAxis {
  export interface Attrs extends ContinuousAxis.Attrs {
    ticker: BasicTicker
    formatters: BasicTickFormatter
  }

  export interface Opts extends ContinuousAxis.Opts {}
}

export interface LinearAxis extends LinearAxis.Attrs {}

export class LinearAxis extends ContinuousAxis {

  ticker: BasicTicker
  formatters: BasicTickFormatter

  constructor(attrs?: Partial<LinearAxis.Attrs>, opts?: LinearAxis.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "LinearAxis"
    this.prototype.default_view = LinearAxisView

    this.override({
      ticker:    () => new BasicTicker(),
      formatter: () => new BasicTickFormatter(),
    })
  }
}
LinearAxis.initClass()
