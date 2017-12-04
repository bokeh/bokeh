import {LinearAxis, LinearAxisView} from "./linear_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"

export class DatetimeAxisView extends LinearAxisView {}

export class DatetimeAxis extends LinearAxis {
  // XXX
  //ticker:    DatetimeTicker
  //formatter: DatetimeTickFormatter
}

DatetimeAxis.prototype.type = "DatetimeAxis"

DatetimeAxis.prototype.default_view = DatetimeAxisView

DatetimeAxis.override({
  ticker:    () => new DatetimeTicker(),
  formatter: () => new DatetimeTickFormatter(),
})
