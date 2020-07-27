import {Interpolator} from "./interpolator"
import {StepMode} from "core/enums"
import * as p from "core/properties"
import {min, find_index, find_last_index} from "core/util/array"

export namespace StepInterpolator {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Interpolator.Props & {
    mode: p.Property<StepMode>
  }
}

export interface StepInterpolator extends StepInterpolator.Attrs {}

export class StepInterpolator extends Interpolator {
  properties: StepInterpolator.Props

  constructor(attrs?: Partial<StepInterpolator.Attrs>) {
    super(attrs)
  }

  static init_StepInterpolator(): void {
    this.define<StepInterpolator.Props>({
      mode: [ p.StepMode, "after" ],
    })
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

    let ind: number
    switch (this.mode) {
      case "after": {
        ind = find_last_index(this._x_sorted, num => x >= num)
        break
      }
      case "before": {
        ind = find_index(this._x_sorted, num => x <= num)
        break
      }
      case "center": {
        const diffs = this._x_sorted.map((tx) => Math.abs(tx - x))
        const mdiff = min(diffs)
        ind = find_index(diffs, num => mdiff === num)
        break
      }
      default:
        throw new Error(`unknown mode: ${this.mode}`)
    }

    return ind != -1 ? this._y_sorted[ind] : NaN
  }
}
