import {LinearAxis, LinearAxisView} from "./linear_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"
import * as p from "core/properties"

export class DatetimeAxisView extends LinearAxisView {
  override model: DatetimeAxis
}

export namespace DatetimeAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LinearAxis.Props & {
    ticker: p.Property<DatetimeTicker>
    formatter: p.Property<DatetimeTickFormatter>
  }
}

export interface DatetimeAxis extends DatetimeAxis.Attrs {}

export class DatetimeAxis extends LinearAxis {
  override properties: DatetimeAxis.Props
  override __view_type__: DatetimeAxisView

  constructor(attrs?: Partial<DatetimeAxis.Attrs>) {
    super(attrs)
  }

  override ticker: DatetimeTicker
  formatter: DatetimeTickFormatter

  static init_DatetimeAxis(): void {
    this.prototype.default_view = DatetimeAxisView

    this.override<DatetimeAxis.Props>({
      ticker:    () => new DatetimeTicker(),
      formatter: () => new DatetimeTickFormatter(),
    })
  }
}
