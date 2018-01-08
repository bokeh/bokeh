/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model"
;

export class Transform extends Model {

  // default implementation based on compute
  v_compute(xs) {
    if ((this.range != null ? this.range.v_synthetic : undefined) != null) {
      xs = this.range.v_synthetic(xs);
    }
    const result = new Float64Array(xs.length);
    for (let idx = 0; idx < xs.length; idx++) {
      const x = xs[idx];
      result[idx] = this.compute(x, false);
    }
    return result;
  }
}
