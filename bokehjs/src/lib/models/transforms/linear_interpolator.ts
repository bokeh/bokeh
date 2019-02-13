import {find_last_index} from "core/util/array"
import {Interpolator} from "./interpolator"
import * as p from "core/properties"

export namespace LinearInterpolator {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Interpolator.Props
}

export interface LinearInterpolator extends LinearInterpolator.Attrs {}

export class LinearInterpolator extends Interpolator {
  properties: LinearInterpolator.Props

  constructor(attrs?: Partial<LinearInterpolator.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LinearInterpolator"
  }

  compute(x: number): number {
    this.sort(false)

    if (this.clip) {
      if (x < this._x_sorted[0] || x > this._x_sorted[this._x_sorted.length-1])
        return NaN
    } else {
      if (x < this._x_sorted[0])
        return this._y_sorted[0]
      if (x > this._x_sorted[this._x_sorted.length-1])
        return this._y_sorted[this._y_sorted.length-1]
    }

    if (x == this._x_sorted[0])
      return this._y_sorted[0]

    const ind = find_last_index(this._x_sorted, num => num < x)

    const x1 = this._x_sorted[ind]
    const x2 = this._x_sorted[ind+1]
    const y1 = this._y_sorted[ind]
    const y2 = this._y_sorted[ind+1]

    return y1 + (((x-x1) / (x2-x1)) * (y2-y1))
  }
}
LinearInterpolator.initClass()
