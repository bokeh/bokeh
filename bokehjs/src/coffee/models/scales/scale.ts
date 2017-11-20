import {Transform} from "../transforms"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import * as p from "core/properties"

export abstract class Scale extends Transform {

  source_range: Range
  target_range: Range1d

  abstract compute(x: number): number

  abstract v_compute(xs: number[] | Float64Array): Float64Array

  abstract invert(sx: number): number

  abstract v_invert(sxs: number[] | Float64Array): Float64Array

  r_compute(x0: number, x1: number): [number, number] {
    if (this.target_range.is_reversed)
      return [this.compute(x1), this.compute(x0)]
    else
      return [this.compute(x0), this.compute(x1)]
  }

  r_invert(sx0: number, sx1: number): [number, number] {
    if (this.target_range.is_reversed)
      return [this.invert(sx1), this.invert(sx0)]
    else
      return [this.invert(sx0), this.invert(sx1)]
  }
}

Scale.prototype.type = "Scale"

Scale.internal({
  source_range: [ p.Any ],
  target_range: [ p.Any ], // p.Instance(Range1d)
})
