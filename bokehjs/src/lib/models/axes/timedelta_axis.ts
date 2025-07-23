import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {TimedeltaTickFormatter} from "../formatters/timedelta_tick_formatter"
import {TimedeltaTicker} from "../tickers/timedelta_ticker"
import type * as p from "core/properties"

export class TimedeltaAxisView extends ContinuousAxisView {
  declare model: TimedeltaAxis
}

export namespace TimedeltaAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props
}

export interface TimedeltaAxis extends TimedeltaAxis.Attrs {}

export class TimedeltaAxis extends ContinuousAxis {
  declare properties: TimedeltaAxis.Props
  declare __view_type__: TimedeltaAxisView

  declare ticker: TimedeltaTicker
  declare formatter: TimedeltaTickFormatter

  constructor(attrs?: Partial<TimedeltaAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TimedeltaAxisView

    this.override<TimedeltaAxis.Props>({
      ticker:    () => new TimedeltaTicker(),
      formatter: () => new TimedeltaTickFormatter(),
    })
  }
}
