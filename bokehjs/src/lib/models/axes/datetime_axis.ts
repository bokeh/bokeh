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

  export interface Props extends LinearAxis.Props {}
}

export interface DatetimeAxis extends DatetimeAxis.Attrs {}

export class DatetimeAxis extends LinearAxis {

  properties: DatetimeAxis.Props

  constructor(attrs?: Partial<DatetimeAxis.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "DatetimeAxis"
    this.prototype.default_view = DatetimeAxisView

    this.override({
      ticker:    () => new DatetimeTicker(),
      formatter: () => new DatetimeTickFormatter(),
    })
  }
}
DatetimeAxis.initClass()
