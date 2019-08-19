import {LinearAxis, LinearAxisView} from "./linear_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"
import * as p from "core/properties"

export class DatetimeAxisView extends LinearAxisView {
  model: DatetimeAxis
}

export namespace DatetimeAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LinearAxis.Props & {
    // XXX: ticker:    DatetimeTicker
    // XXX: formatter: DatetimeTickFormatter
  }
}

export interface DatetimeAxis extends DatetimeAxis.Attrs {}

export class DatetimeAxis extends LinearAxis {
  properties: DatetimeAxis.Props

  constructor(attrs?: Partial<DatetimeAxis.Attrs>) {
    super(attrs)
  }

  static init_DatetimeAxis(): void {
    this.prototype.default_view = DatetimeAxisView

    this.override({
      ticker:    () => new DatetimeTicker(),
      formatter: () => new DatetimeTickFormatter(),
    })
  }
}
