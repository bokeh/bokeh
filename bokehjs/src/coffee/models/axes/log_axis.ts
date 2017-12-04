import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"

export class LogAxisView extends AxisView {}

export class LogAxis extends ContinuousAxis {
  ticker:    LogTicker
  formatter: LogTickFormatter
}

LogAxis.prototype.type = "LogAxis"

LogAxis.prototype.default_view = LogAxisView

LogAxis.override({
  ticker:    () => new LogTicker(),
  formatter: () => new LogTickFormatter(),
})
