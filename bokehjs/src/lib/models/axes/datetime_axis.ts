import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {DatetimeTickFormatter} from "../formatters/datetime_tick_formatter"
import {DatetimeTicker} from "../tickers/datetime_ticker"
import * as p from "core/properties"

export class DatetimeAxisView extends ContinuousAxisView {
  override model: DatetimeAxis
}

export namespace DatetimeAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    //ticker: p.Property<DatetimeTicker>
    //formatter: p.Property<DatetimeTickFormatter>
  }
}

export interface DatetimeAxis extends DatetimeAxis.Attrs {}

export class DatetimeAxis extends ContinuousAxis {
  override properties: DatetimeAxis.Props
  override __view_type__: DatetimeAxisView

  override ticker: DatetimeTicker
  override formatter: DatetimeTickFormatter

  constructor(attrs?: Partial<DatetimeAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatetimeAxisView

    this.override<DatetimeAxis.Props>({
      ticker:    () => new DatetimeTicker(),
      formatter: () => new DatetimeTickFormatter(),
    })
  }
}
