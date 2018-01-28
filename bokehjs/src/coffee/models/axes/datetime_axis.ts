import {LinearAxis, LinearAxisView} from "./linear_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"

export class DatetimeAxisView extends LinearAxisView {
  model: DatetimeAxis
}

export namespace DatetimeAxis {
  export interface Attrs extends LinearAxis.Attrs {
    // XXX: ticker:    DatetimeTicker
    // XXX: formatter: DatetimeTickFormatter
  }

  export interface Opts extends LinearAxis.Opts {}
}

export interface DatetimeAxis extends DatetimeAxis.Attrs {}

export class DatetimeAxis extends LinearAxis {

  static initClass() {
    this.prototype.type = "DatetimeAxis"
    this.prototype.default_view = DatetimeAxisView

    this.override({
      ticker:    () => new DatetimeTicker(),
      formatter: () => new DatetimeTickFormatter(),
    })
  }
}
DatetimeAxis.initClass()
