import {TickFormatter, TickFormatterView} from "./tick_formatter"
import {BasicTickFormatter, BasicTickFormatterView, unicode_replace} from "./basic_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import type {LogAxisView} from "../axes/log_axis"
import {GraphicsBox, BaseExpo, TextBox} from "core/graphics"
import {build_view} from "core/build_views"
import * as p from "core/properties"

const {log, round} = Math

export class LogTickFormatterView extends TickFormatterView {
  model: LogTickFormatter
  parent: LogAxisView

  protected basic_formatter: BasicTickFormatter
  protected basic_formatter_view: BasicTickFormatterView

  initialize(): void {
    super.initialize()
    this.basic_formatter = new BasicTickFormatter()
  }

  async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.basic_formatter_view = await build_view(this.basic_formatter, {parent: this.parent})
  }

  protected _exponents(ticks: number[], base: number): number[] | null {
    let last_exponent = null
    const exponents = []
    for (const tick of ticks) {
      const exponent = round(log(tick)/log(base))
      if (last_exponent != exponent) {
        last_exponent = exponent
        exponents.push(exponent)
      } else
        return null
    }
    return exponents
  }

  format_graphics(ticks: number[]): GraphicsBox[] {
    if (ticks.length == 0)
      return []

    const {base} = this.parent.model.ticker
    const expos = this._exponents(ticks, base)

    if (expos == null)
      return this.basic_formatter_view.format_graphics(ticks)
    else {
      return expos.map((expo) => {
        const b = new TextBox({text: unicode_replace(`${base}`)})
        const e = new TextBox({text: unicode_replace(`${expo}`)})
        return new BaseExpo(b, e)
      })
    }
  }

  format(ticks: number[]): string[] {
    if (ticks.length == 0)
      return []

    const {base} = this.parent.model.ticker
    const expos = this._exponents(ticks, base)

    if (expos == null)
      return this.basic_formatter_view.format(ticks)
    else
      return expos.map((expo) => unicode_replace(`${base}^${expo}`))
  }
}

export namespace LogTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    /** @deprecated */
    ticker: p.Property<LogTicker | null>
  }
}

export interface LogTickFormatter extends LogTickFormatter.Attrs {}

export class LogTickFormatter extends TickFormatter {
  properties: LogTickFormatter.Props
  __view_type__: LogTickFormatterView

  constructor(attrs?: Partial<LogTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_LogTickFormatter(): void {
    this.prototype.default_view = LogTickFormatterView

    this.define<LogTickFormatter.Props>(({Ref, Nullable}) => ({
      /** @deprecated */
      ticker: [ Nullable(Ref(LogTicker)), null ],
    }))
  }
}
