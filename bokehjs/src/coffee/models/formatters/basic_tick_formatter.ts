/* XXX: partial */
import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties";
import {isNumber} from "core/util/types"

export namespace BasicTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    precision: number | "auto"
    use_scientific: boolean
    power_limit_high: number
    power_limit_low: number
  }

  export interface Opts extends TickFormatter.Opts {}
}

export interface BasicTickFormatter extends BasicTickFormatter.Attrs {}

export class BasicTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<BasicTickFormatter.Attrs>, opts?: BasicTickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'BasicTickFormatter';

    this.define({
      precision:        [ p.Any,    'auto' ], // TODO (bev) better
      use_scientific:   [ p.Bool,   true   ],
      power_limit_high: [ p.Number, 5      ],
      power_limit_low:  [ p.Number, -3     ],
    });
  }

  get scientific_limit_low() {
    return Math.pow(10.0, this.power_limit_low)
  }

  get scientific_limit_high() {
    return Math.pow(10.0, this.power_limit_high)
  }

  initialize(): void {
    super.initialize();
    this.last_precision = 3;
  }

  doFormat(ticks, _axis) {
    let labels;
    if (ticks.length === 0) {
      return [];
    }

    let zero_eps = 0;
    if (ticks.length >= 2) {
      zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000;
    }

    let need_sci = false;
    if (this.use_scientific) {
      for (const tick of ticks) {
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
        for (let i = 0, end = ticks.length; i < end; i++) {
          labels[i] = ticks[i].toExponential(precision || undefined);
        }
      } else {
        for (let i = 0, end = ticks.length; i < end; i++) {
          labels[i] = ticks[i].toFixed(precision || undefined).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
        }
      }
      return labels;

    } else if (precision === 'auto') {
      labels = new Array(ticks.length);
      for (let x = this.last_precision, asc = this.last_precision <= 15; asc ? x <= 15 : x >= 15; asc ? x++ : x--) {
        let is_ok = true;
        if (need_sci) {
          for (let i = 0, end = ticks.length; i < end; i++) {
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
          for (let i = 0, end = ticks.length; i < end; i++) {
            labels[i] = ticks[i].toFixed(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
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
