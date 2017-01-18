import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"

export class LogAxisView extends AxisView

export class LogAxis extends ContinuousAxis
  default_view: LogAxisView

  type: 'LogAxis'

  @override {
    ticker:    () -> new LogTicker()
    formatter: () -> new LogTickFormatter()
  }
