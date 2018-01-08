/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties";
import {isNumber} from "core/util/types"
;

export class BasicTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'BasicTickFormatter';

    this.define({
      precision:        [ p.Any,    'auto' ], // TODO (bev) better
      use_scientific:   [ p.Bool,   true   ],
      power_limit_high: [ p.Number, 5      ],
      power_limit_low:  [ p.Number, -3     ]
    });

    this.getters({
      scientific_limit_low() { return Math.pow(10.0, this.power_limit_low); },
      scientific_limit_high() { return Math.pow(10.0, this.power_limit_high); }
    });
  }

  initialize(attrs, options) {
    super.initialize(attrs, options);
    return this.last_precision = 3;
  }

  doFormat(ticks, axis) {
    let i, labels;
    if (ticks.length === 0) {
      return [];
    }

    let zero_eps = 0;
    if (ticks.length >= 2) {
      zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000;
    }

    let need_sci = false;
    if (this.use_scientific) {
      for (let tick of Array.from(ticks)) {
        const tick_abs = Math.abs(tick);
        if ((tick_abs > zero_eps) &&
            ((tick_abs >= this.scientific_limit_high) ||
            (tick_abs <= this.scientific_limit_low))) {
          need_sci = true;
          break;
        }
      }
    }

    const { precision } = this;

    if ((precision == null) || isNumber(precision)) {
      labels = new Array(ticks.length);
      if (need_sci) {
        let asc, end;
        for (i = 0, end = ticks.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
          labels[i] = ticks[i].toExponential(precision || undefined);
        }
      } else {
        let asc1, end1;
        for (i = 0, end1 = ticks.length, asc1 = 0 <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
          labels[i] = ticks[i].toFixed(precision || undefined).replace(
            /(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
        }
      }
      return labels;

    } else if (precision === 'auto') {
      labels = new Array(ticks.length);
      for (let x = this.last_precision, asc2 = this.last_precision <= 15; asc2 ? x <= 15 : x >= 15; asc2 ? x++ : x--) {
        let is_ok = true;
        if (need_sci) {
          var asc3, end2;
          for (i = 0, end2 = ticks.length, asc3 = 0 <= end2; asc3 ? i < end2 : i > end2; asc3 ? i++ : i--) {
            labels[i] = ticks[i].toExponential(x);
            if (i > 0) {
              if (labels[i] === labels[i-1]) {
                is_ok = false;
                break;
              }
            }
          }
          if (is_ok) {
            break;
          }
        } else {
          var asc4, end3;
          for (i = 0, end3 = ticks.length, asc4 = 0 <= end3; asc4 ? i < end3 : i > end3; asc4 ? i++ : i--) {
            labels[i] = ticks[i].toFixed(x).replace(
              /(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
            if (i > 0) {
              if (labels[i] === labels[i-1]) {
                is_ok = false;
                break;
              }
            }
          }
          if (is_ok) {
            break;
          }
        }

        if (is_ok) {
          this.last_precision = x;
          return labels;
        }
      }
    }

    return labels;
  }
}
BasicTickFormatter.initClass();
