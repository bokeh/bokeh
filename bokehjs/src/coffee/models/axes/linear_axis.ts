import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"

export class LinearAxisView extends AxisView {}

export class LinearAxis extends ContinuousAxis {

  static initClass() {
    this.prototype.type = "LinearAxis"

    this.prototype.default_view = LinearAxisView

    this.override({
      ticker:    () => new BasicTicker(),
      formatter: () => new BasicTickFormatter(),
    })
  }

  ticker: BasicTicker
  formatters: BasicTickFormatter
}

LinearAxis.initClass()
