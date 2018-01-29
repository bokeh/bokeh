/* XXX: partial */
import {findLastIndex} from "core/util/array";
import {Interpolator} from "./interpolator"

export namespace LinearInterpolator {
  export interface Attrs extends Interpolator.Attrs {}

  export interface Opts extends Interpolator.Opts {}
}

export interface LinearInterpolator extends LinearInterpolator.Attrs {}

export class LinearInterpolator extends Interpolator {

  constructor(attrs?: Partial<LinearInterpolator.Attrs>, opts?: LinearInterpolator.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "LinearInterpolator"
  }

  compute(x) {
    // Apply the transform to a single value
    let descending;
    this.sort(descending = false);

    if (this.clip === true) {
      if ((x < this._x_sorted[0]) || (x > this._x_sorted[this._x_sorted.length-1])) {
        return null;
      }
    } else {
      if (x < this._x_sorted[0]) {
        return this._y_sorted[0];
      }
      if (x > this._x_sorted[this._x_sorted.length-1]) {
        return this._y_sorted[this._y_sorted.length-1];
      }
    }

    if (x === this._x_sorted[0]) {
      return this._y_sorted[0];
    }

    const ind = findLastIndex(this._x_sorted, num => num < x);

    const x1 = this._x_sorted[ind];
    const x2 = this._x_sorted[ind+1];
    const y1 = this._y_sorted[ind];
    const y2 = this._y_sorted[ind+1];

    const ret = y1 + (((x-x1) / (x2-x1)) * (y2-y1));
    return ret;
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
LinearInterpolator.initClass()
