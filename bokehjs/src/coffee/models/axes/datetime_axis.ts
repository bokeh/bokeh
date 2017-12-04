import {LinearAxis, LinearAxisView} from "./linear_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"

export class DatetimeAxisView extends LinearAxisView

export class DatetimeAxis extends LinearAxis
  default_view: DatetimeAxisView

  type: 'DatetimeAxis'

  @override {
    ticker:    () -> new DatetimeTicker()
    formatter: () -> new DatetimeTickFormatter()
  }
