import {TickFormatter} from "./tick_formatter"
import {BasicTickFormatter} from "./basic_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import {GraphicsBox, BaseExpo, TextBox} from "core/graphics"
import * as p from "core/properties"

const {log, round} = Math

export namespace LogTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<LogTicker | null>
  }
}

export interface LogTickFormatter extends LogTickFormatter.Attrs {}

export class LogTickFormatter extends TickFormatter {
  properties: LogTickFormatter.Props

  constructor(attrs?: Partial<LogTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_LogTickFormatter(): void {
    this.define<LogTickFormatter.Props>(({Ref, Nullable}) => ({
      ticker: [ Nullable(Ref(LogTicker)), null ],
    }))
  }

  protected basic_formatter: BasicTickFormatter

  initialize(): void {
    super.initialize()
    this.basic_formatter = new BasicTickFormatter()
  }

  format_graphics(ticks: number[], opts: {loc: number}): GraphicsBox[] {
    if (ticks.length == 0)
      return []

    const base = this.ticker?.base ?? 10
    const expos = this._exponents(ticks, base)

    if (expos == null)
      return this.basic_formatter.format_graphics(ticks, opts)
    else
      return expos.map((expo) => new BaseExpo(new TextBox({text: `${base}`}), new TextBox({text: expo})))
  }

  protected _exponents(ticks: number[], base: number): string[] | null {
    let last_expo = null
    const exponents = []
    for (const tick of ticks) {
      const expo = `${round(log(tick)/log(base))}`
      if (last_expo != expo) {
        last_expo = expo
        exponents.push(expo)
      } else
        return null
    }
    return exponents
  }

  doFormat(ticks: number[], opts: {loc: number}): string[] {
    if (ticks.length == 0)
      return []

    const base = this.ticker?.base ?? 10
    const expos = this._exponents(ticks, base)

    if (expos == null)
      return this.basic_formatter.doFormat(ticks, opts)
    else
      return expos.map((expo) => `${base}^${expo}`)
  }
}
