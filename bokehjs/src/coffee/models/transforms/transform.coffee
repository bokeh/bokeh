import {Model} from "../../model"

export class Transform extends Model

  # default implementation based on compute
  v_compute: (xs) ->
    if @range?.v_synthetic?
      xs = @range.v_synthetic(xs)
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x, false)
    return result
