import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import type * as p from "core/properties"

export class LogAxisView extends ContinuousAxisView {
  declare model: LogAxis
}

export namespace LogAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    //ticker: p.Property<LogTicker>
    //formatter: p.Property<LogTickFormatter>
  }
}

export interface LogAxis extends LogAxis.Attrs {}

export class LogAxis extends ContinuousAxis {
  declare properties: LogAxis.Props
  declare __view_type__: LogAxisView

  declare ticker: LogTicker
  declare formatter: LogTickFormatter

  constructor(attrs?: Partial<LogAxis.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LogAxisView

    this.override<LogAxis.Props>({
      ticker:    () => new LogTicker(),
      formatter: () => new LogTickFormatter(),
    })
  }
}
