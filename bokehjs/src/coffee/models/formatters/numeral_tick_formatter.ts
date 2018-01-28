/* XXX: partial */
import * as Numbro from "numbro";

import {TickFormatter} from "./tick_formatter";
import {RoundingFunction} from "core/enums"
import * as p from "core/properties"

export namespace NumeralTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    format: string
    language: string
    rounding: RoundingFunction
  }

  export interface Opts extends TickFormatter.Opts {}
}

export interface NumeralTickFormatter extends NumeralTickFormatter.Attrs {}

export class NumeralTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<NumeralTickFormatter.Attrs>, opts?: NumeralTickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'NumeralTickFormatter';

    this.define({
      // TODO (bev) all of these could be tightened up
      format:   [ p.String, '0,0'   ],
      language: [ p.String, 'en'    ],
      rounding: [ p.String, 'round' ],
    });
  }

  doFormat(ticks, _axis) {
    const { format } = this;
    const { language } = this;
    const rounding = (() => { switch (this.rounding) {
      case "round": case "nearest":   return Math.round;
      case "floor": case "rounddown": return Math.floor;
      case "ceil":  case "roundup":   return Math.ceil;
    } })();

    const labels = (ticks.map((tick) => Numbro.format(tick, format, language, rounding)));
    return labels;
  }
}
NumeralTickFormatter.initClass();
