import * as Numbro from "numbro"

import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"
import {RoundingFunction} from "core/enums"
import * as p from "core/properties"

export namespace NumeralTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    format: string
    language: string
    rounding: RoundingFunction
  }

  export interface Props extends TickFormatter.Props {}
}

export interface NumeralTickFormatter extends NumeralTickFormatter.Attrs {}

export class NumeralTickFormatter extends TickFormatter {

  properties: NumeralTickFormatter.Props

  constructor(attrs?: Partial<NumeralTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'NumeralTickFormatter'

    this.define({
      // TODO (bev) all of these could be tightened up
      format:   [ p.String, '0,0'   ],
      language: [ p.String, 'en'    ],
      rounding: [ p.String, 'round' ],
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

  doFormat(ticks: number[], _axis: Axis): string[] {
    const {format, language, _rounding_fn} = this
    return ticks.map((tick) => Numbro.format(tick, format, language, _rounding_fn))
  }
}
NumeralTickFormatter.initClass()
