import * as Numbro from "@bokeh/numbro"

import {TickFormatter} from "./tick_formatter"
import {RoundingFunction} from "core/enums"
import type * as p from "core/properties"

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
  declare properties: NumeralTickFormatter.Props

  constructor(attrs?: Partial<NumeralTickFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<NumeralTickFormatter.Props>(({Str}) => ({
      // TODO (bev) all of these could be tightened up
      format:   [ Str,           "0,0"   ],
      language: [ Str,           "en"    ],
      rounding: [ RoundingFunction, "round" ],
    }))
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
