import {LinearAxis, LinearAxisView} from "./linear_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"

export class DatetimeAxisView extends LinearAxisView {}

export class DatetimeAxis extends LinearAxis {

  static initClass() {
    this.prototype.type = "DatetimeAxis"

    this.prototype.default_view = DatetimeAxisView

    this.override({
      ticker:    () => new DatetimeTicker(),
      formatter: () => new DatetimeTickFormatter(),
    })
  }

  // XXX
  //ticker:    DatetimeTicker
  //formatter: DatetimeTickFormatter
}

DatetimeAxis.initClass()
