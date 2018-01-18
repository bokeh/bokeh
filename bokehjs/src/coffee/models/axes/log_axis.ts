import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"

export class LogAxisView extends AxisView {}

export class LogAxis extends ContinuousAxis {

  static initClass() {
    this.prototype.type = "LogAxis"

    this.prototype.default_view = LogAxisView

    this.override({
      ticker:    () => new LogTicker(),
      formatter: () => new LogTickFormatter(),
    })
  }

  ticker:    LogTicker
  formatter: LogTickFormatter
}

LogAxis.initClass()
