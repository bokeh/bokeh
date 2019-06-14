import {TickFormatter} from "./tick_formatter"
import {BasicTickFormatter} from "./basic_tick_formatter"
import {LogTicker} from "../tickers/log_ticker"
import {logger} from "core/logging"
import * as p from "core/properties"

export namespace LogTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    ticker: p.Property<LogTicker | null>
    use_superscript_exponents: p.Property<boolean>
  }
}

export interface LogTickFormatter extends LogTickFormatter.Attrs {}

export class LogTickFormatter extends TickFormatter {
  properties: LogTickFormatter.Props

  constructor(attrs?: Partial<LogTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'LogTickFormatter'

    this.define<LogTickFormatter.Props>({
      ticker: [ p.Instance, null ],
      use_superscript_exponents:   [ p.Boolean, false   ],
    })
  }

  protected basic_formatter: BasicTickFormatter

  initialize(): void {
    super.initialize()
    this.basic_formatter = new BasicTickFormatter()
    if (this.ticker == null)
      logger.warn("LogTickFormatter not configured with a ticker, using default base of 10 (labels will be incorrect if ticker base is not 10)")
  }

  doFormat(ticks: number[], opts: {loc: number}): string[] {
    if (ticks.length == 0)
      return []

    const base = this.ticker != null ? this.ticker.base : 10
    
    const translate: { [id: string]: string; } = { 0:"\u2070", 1:"\u00b9", 2:"\u00b2", 3:"\u00b3", 4:"\u2074", 5:"\u2075", 6:"\u2076", 7:"\u2077", 8:"\u2078", 9:"\u2079", "+":"\u207a", "-":"\u207b" }

    let small_interval = false
    const labels: string[] = new Array(ticks.length)
    for (let i = 0, end = ticks.length; i < end; i++) {
      
      const exponent = Math.round(Math.log(ticks[i]) / Math.log(base))
      
      if (!this.use_superscript_exponents)
        labels[i] = `${base}^${exponent}`
      else
        labels[i] = `${base}${exponent.toString().replace(/[0-9\+\-]/g,  match => translate[match])}`
            
      if (i > 0 && labels[i] == labels[i-1]) {
        small_interval = true
        break
      }
    }

    if (small_interval)
      return this.basic_formatter.doFormat(ticks, opts)
    else
      return labels
  }
}
LogTickFormatter.initClass()
