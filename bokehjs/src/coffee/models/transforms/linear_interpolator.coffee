import {findLastIndex} from "core/util/array"
import {Interpolator} from "./interpolator"

export class LinearInterpolator extends Interpolator

  compute: (x) ->
    # Apply the transform to a single value
    @sort(descending = false)

    if @clip == true
      if x < @_x_sorted[0] or x > @_x_sorted[@_x_sorted.length-1]
        return null
    else
      if x < @_x_sorted[0]
        return @_y_sorted[0]
      if x > @_x_sorted[@_x_sorted.length-1]
        return @_y_sorted[@_y_sorted.length-1]

    if x == @_x_sorted[0]
      return @_y_sorted[0]

    ind = findLastIndex(@_x_sorted, (num) -> num < x)

    x1 = @_x_sorted[ind]
    x2 = @_x_sorted[ind+1]
    y1 = @_y_sorted[ind]
    y2 = @_y_sorted[ind+1]

    ret = y1 + (((x-x1) / (x2-x1)) * (y2-y1))
    return ret

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result
