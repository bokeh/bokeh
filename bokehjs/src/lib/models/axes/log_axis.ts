import {ContinuousAxis, ContinuousAxisView} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import * as p from "core/properties"

export class LogAxisView extends ContinuousAxisView {
  override model: LogAxis
}

export namespace LogAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousAxis.Props & {
    ticker:    p.Property<LogTicker>
    formatter: p.Property<LogTickFormatter>
  }
}

export interface LogAxis extends LogAxis.Attrs {}

export class LogAxis extends ContinuousAxis {
  override properties: LogAxis.Props
  override __view_type__: LogAxisView

  ticker:    LogTicker
  formatter: LogTickFormatter

  constructor(attrs?: Partial<LogAxis.Attrs>) {
    super(attrs)
  }

  static init_LogAxis(): void {
    this.prototype.default_view = LogAxisView

    this.override<LogAxis.Props>({
      ticker:    () => new LogTicker(),
      formatter: () => new LogTickFormatter(),
    })
  }
}
