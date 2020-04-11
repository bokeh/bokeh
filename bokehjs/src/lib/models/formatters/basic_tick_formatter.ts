import {TickFormatter} from "./tick_formatter"
import * as p from "core/properties"

export namespace BasicTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    precision: p.Property<number | "auto">
    use_scientific: p.Property<boolean>
    power_limit_high: p.Property<number>
    power_limit_low: p.Property<number>
  }
}

export interface BasicTickFormatter extends BasicTickFormatter.Attrs {}

export class BasicTickFormatter extends TickFormatter {
  properties: BasicTickFormatter.Props

  constructor(attrs?: Partial<BasicTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_BasicTickFormatter(): void {
    this.define<BasicTickFormatter.Props>({
      precision:        [ p.Any,     'auto' ], // TODO (bev) better
      use_scientific:   [ p.Boolean, true   ],
      power_limit_high: [ p.Number,  5      ],
      power_limit_low:  [ p.Number,  -3     ],
    })
  }

  protected last_precision: number = 3

  get scientific_limit_low(): number {
    return 10.0**this.power_limit_low
  }

  get scientific_limit_high(): number {
    return 10.0**this.power_limit_high
  }

  _need_sci(ticks: number[]): boolean {
    if (!this.use_scientific)
      return false

    const {scientific_limit_high} = this
    const {scientific_limit_low} = this
    const zeroish = ticks.length < 2 ? 0 : Math.abs(ticks[1] - ticks[0]) / 10000

    for (const tick of ticks) {
      const tick_abs = Math.abs(tick)
      if (tick_abs <= zeroish)
        continue
      if (tick_abs >= scientific_limit_high || tick_abs <= scientific_limit_low) {
        return true
      }
    }

    return false
  }

  _format_with_precision(ticks: number[], need_sci: boolean, precision: number|undefined): string[] {
    const labels: string[] = new Array(ticks.length)

    if (need_sci) {
      for (let i = 0, end = ticks.length; i < end; i++) {
        labels[i] = ticks[i].toExponential(precision)
      }
    } else {
      for (let i = 0, end = ticks.length; i < end; i++) {
        // strip trailing zeros
        labels[i] = ticks[i].toFixed(precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
      }
    }

    return labels
  }

  _auto_precision(ticks: number[], need_sci: boolean): number|undefined {
    const labels: string[] = new Array(ticks.length)
    const asc = this.last_precision <= 15

    outer:
    for (let x = this.last_precision; asc ? x <= 15 : x >= 1; asc ? x++ : x--) {
      if (need_sci) {
        labels[0] = ticks[0].toExponential(x)
        for (let i = 1; i < ticks.length; i++) {
          if (labels[i] == labels[i-1]) {
            continue outer
          }
        }
        this.last_precision = x
        break
      } else {
        labels[0] = ticks[0].toFixed(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
        for (let i = 1; i < ticks.length; i++) {
          labels[i] = ticks[i].toFixed(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "")
          if (labels[i] == labels[i-1]) {
            continue outer
          }
        }
        this.last_precision = x
        break
      }
    }
    return this.last_precision
  }

  doFormat(ticks: number[], _opts: {loc: number}): string[] {
    if (ticks.length == 0)
      return []
    const need_sci = this._need_sci(ticks)
    const precision = this.precision == "auto" ? this._auto_precision(ticks, need_sci) : this.precision
    return this._format_with_precision(ticks, need_sci, precision)
  }

}
