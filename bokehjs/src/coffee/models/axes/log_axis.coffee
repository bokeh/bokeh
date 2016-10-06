import * as _ from "underscore"

import * as Axis from "./axis"
import * as ContinuousAxis from "./continuous_axis"
import * as LogTickFormatter from "../formatters/log_tick_formatter"
import * as LogTicker from "../tickers/log_ticker"

class LogAxisView extends Axis.View

class LogAxis extends ContinuousAxis.Model
  default_view: LogAxisView

  type: 'LogAxis'

  @override {
    ticker:    () -> new LogTicker.Model()
    formatter: () -> new LogTickFormatter.Model()
  }

export {
  LogAxis as Model
  LogAxisView as View
}
