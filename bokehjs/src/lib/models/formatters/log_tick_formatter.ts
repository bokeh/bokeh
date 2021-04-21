import {TickFormatter} from "./tick_formatter"
import {BasicTickFormatter, unicode_replace} from "./basic_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import {GraphicsBox, BaseExpo, TextBox} from "core/graphics"
import * as p from "core/properties"

const {min, max, log, round} = Math

export namespace LogTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<LogTicker | null>
    min_exponent: p.Property<number[] | number>
  }
}

export interface LogTickFormatter extends LogTickFormatter.Attrs {}

export class LogTickFormatter extends TickFormatter {
  properties: LogTickFormatter.Props

  constructor(attrs?: Partial<LogTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_LogTickFormatter(): void {
    this.define<LogTickFormatter.Props>(({Or, Int, Array, Ref, Nullable}) => ({
      ticker: [ Nullable(Ref(LogTicker)), null ],
      min_exponent: [ Or(Array(Int), Int), 0 ],
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
    else {
      let _low = (this.min_exponent.constructor === Array) ? min(...this.min_exponent) : -this.min_exponent
      let _high = (this.min_exponent.constructor === Array) ? max(...this.min_exponent) : this.min_exponent
      return expos.map((expo) => {
        if (_low<expo && expo<_high){
            const b = new TextBox({text: unicode_replace(`${base**expo}`)})
            const e = new TextBox({text: ''})
            return new BaseExpo(b, e)
        }else{
            const b = new TextBox({text: unicode_replace(`${base}`)})
            const e = new TextBox({text: unicode_replace(`${expo}`)})
            return new BaseExpo(b, e)
        }
      })
    }
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

  doFormat(ticks: number[], opts: {loc: number}): string[] {
    if (ticks.length == 0)
      return []

    const base = this.ticker?.base ?? 10
    const expos = this._exponents(ticks, base)
    if (expos == null)
      return this.basic_formatter.doFormat(ticks, opts)
    else
      console.log(this.min_exponent)
      let _low = (this.min_exponent.constructor === Array) ?  min(...this.min_exponent) : -this.min_exponent
      let _high = (this.min_exponent.constructor === Array) ?  max(...this.min_exponent) : this.min_exponent
      return expos.map((expo) => {
        if (_low<expo && expo<_high)
          return unicode_replace(`${base**expo}`)
        else
          return unicode_replace(`${base}^${expo}`)
      }
    )
  }
}
