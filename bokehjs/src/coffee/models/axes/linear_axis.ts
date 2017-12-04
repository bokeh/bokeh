import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {BasicTicker} from "../tickers/basic_ticker"

export class LinearAxisView extends AxisView

export class LinearAxis extends ContinuousAxis
  default_view: LinearAxisView

  type: 'LinearAxis'

  @override {
    ticker:    () -> new BasicTicker()
    formatter: () -> new BasicTickFormatter()
  }
