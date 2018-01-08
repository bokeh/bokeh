/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import * as Numbro from "numbro";

import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties"
;

export class NumeralTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'NumeralTickFormatter';

    this.define({
      // TODO (bev) all of these could be tightened up
      format:   [ p.String, '0,0'   ],
      language: [ p.String, 'en'    ],
      rounding: [ p.String, 'round' ]
    });
  }

  doFormat(ticks, axis) {
    const { format } = this;
    const { language } = this;
    const rounding = (() => { switch (this.rounding) {
      case "round": case "nearest":   return Math.round;
      case "floor": case "rounddown": return Math.floor;
      case "ceil":  case "roundup":   return Math.ceil;
    } })();

    const labels = ( Array.from(ticks).map((tick) => Numbro.format(tick, format, language, rounding)) );
    return labels;
  }
}
NumeralTickFormatter.initClass();
