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
    
    const translate: { [id: string]: string; } = { "0":"⁰", "1":"¹", "2":"²", "3":"³", "4":"⁴", "5":"⁵", "6":"⁶", "7":"⁷", "8":"⁸", "9":"⁹", "+":"⁺", "-":"⁻" }

    let small_interval = false
    const labels: string[] = new Array(ticks.length)
    for (let i = 0, end = ticks.length; i < end; i++) {
      if (!this.use_superscript_exponents)
		labels[i] = `${base}^${Math.round(Math.log(ticks[i]) / Math.log(base))}`
	  else
	    labels[i] = `${base}${(Math.round(Math.log(ticks[i]) / Math.log(base))).toString().replace(/[0-9\+\-]/g,  function(match){return translate[match]})}`
	  
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
