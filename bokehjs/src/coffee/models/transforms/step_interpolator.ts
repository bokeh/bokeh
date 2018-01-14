/* XXX: partial */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Interpolator} from "./interpolator";
import * as p from "core/properties";
import {min, findIndex, findLastIndex} from "core/util/array"


export class StepInterpolator extends Interpolator {
  static initClass() {

    this.define({
      mode: [ p.StepMode, "after"]
    });
  }

  compute(x) {
    // Apply the transform to a single value
    let descending, ret;
    this.sort(descending = false);

    if (this.clip === true) {
      if ((x < this._x_sorted[0]) || (x > this._x_sorted[this._x_sorted.length-1])) {
        return(null);
      }
    } else {
      if (x < this._x_sorted[0]) {
        return this._y_sorted[0];
      }
      if (x > this._x_sorted[this._x_sorted.length-1]) {
        return this._y_sorted[this._y_sorted.length-1];
      }
    }

    let ind = -1;
    if (this.mode === "after") {
      ind = findLastIndex(this._x_sorted, num => x >= num);
    }

    if (this.mode === "before") {
      ind = findIndex(this._x_sorted, num => x <= num);
    }

    if (this.mode === "center") {
      const diffs = (this._x_sorted.map((tx) => Math.abs(tx - x)));
      const mdiff = min(diffs);
      ind = findIndex(diffs, num => mdiff === num);
    }

    if (ind !== -1) {
      ret = this._y_sorted[ind];
    } else {
      ret = null;
    }

    return(ret);
  }

  v_compute(xs) {
    // Apply the tranform to a vector of values
    const result = new Float64Array(xs.length);
    for (let idx = 0; idx < xs.length; idx++) {
      const x = xs[idx];
      result[idx] = this.compute(x);
    }
    return result;
  }
}
StepInterpolator.initClass();
