import {AxisView} from "./axis"
import {ContinuousAxis} from "./continuous_axis"
import {LogTickFormatter} from "../formatters/log_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import * as p from "core/properties"

export class LogAxisView extends AxisView {
  model: LogAxis
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
  properties: LogAxis.Props

  ticker:    LogTicker
  formatter: LogTickFormatter

  constructor(attrs?: Partial<LogAxis.Attrs>) {
    super(attrs)
  }

  static init_LogAxis(): void {
    this.prototype.default_view = LogAxisView

    this.override({
      ticker:    () => new LogTicker(),
      formatter: () => new LogTickFormatter(),
    })
  }
}
