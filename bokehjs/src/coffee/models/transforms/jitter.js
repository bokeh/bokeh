/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Transform} from "./transform";
import * as p from "core/properties";
import * as bokeh_math from "core/util/math"

export class Jitter extends Transform {
  static initClass() {
    this.define({
      mean:         [ p.Number      , 0        ],
      width:        [ p.Number      , 1        ],
      distribution: [ p.Distribution, 'uniform'],
      range:        [ p.Instance               ]
    });
  }

  compute(x, use_synthetic) {
    if (use_synthetic == null) { use_synthetic = true; }
    if (((this.range != null ? this.range.synthetic : undefined) != null) && use_synthetic) {
      x = this.range.synthetic(x);
    }
    if (this.distribution === 'uniform') {
      return(x + this.mean + ((bokeh_math.random() - 0.5) * this.width));
    }

    if (this.distribution === 'normal') {
      return(x + bokeh_math.rnorm(this.mean, this.width));
    }
  }
}
Jitter.initClass();
