import * as Numbro from "numbro"

import {TickFormatter} from "./tick_formatter"
import {RoundingFunction} from "core/enums"
import * as p from "core/properties"

export namespace NumeralTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    format: p.Property<string>
    language: p.Property<string>
    rounding: p.Property<RoundingFunction>
  }
}

export interface NumeralTickFormatter extends NumeralTickFormatter.Attrs {}

export class NumeralTickFormatter extends TickFormatter {
  properties: NumeralTickFormatter.Props

  constructor(attrs?: Partial<NumeralTickFormatter.Attrs>) {
    super(attrs)
  }

  static init_NumeralTickFormatter(): void {
    this.define<NumeralTickFormatter.Props>({
      // TODO (bev) all of these could be tightened up
      format:   [ p.String,           '0,0'   ],
      language: [ p.String,           'en'    ],
      rounding: [ p.RoundingFunction, 'round' ],
    })
  }

  private get _rounding_fn(): (v: number) => number {
    switch (this.rounding) {
      case "round":
      case "nearest":
        return Math.round
      case "floor":
      case "rounddown":
        return Math.floor
      case "ceil":
      case "roundup":
        return Math.ceil
    }
  }

  doFormat(ticks: number[], _opts: {loc: number}): string[] {
    const {format, language, _rounding_fn} = this
    return ticks.map((tick) => Numbro.format(tick, format, language, _rounding_fn))
  }
}
