import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"

export class LinearAxisView extends AxisView {}

export class LinearAxis extends ContinuousAxis {
  ticker: BasicTicker
  formatters: BasicTickFormatter
}

LinearAxis.prototype.type = "LinearAxis"

LinearAxis.prototype.default_view = LinearAxisView

LinearAxis.override({
  ticker:    () => new BasicTicker(),
  formatter: () => new BasicTickFormatter(),
})
