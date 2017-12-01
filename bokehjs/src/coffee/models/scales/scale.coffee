import {Transform} from "../transforms"
import * as p from "core/properties"

export class Scale extends Transform
  type: "Scale"

  @internal {
    source_range: [ p.Any ]
    target_range: [ p.Any ] # p.Instance(Range1d)
  }

  compute: (x) ->

  v_compute: (xs) ->

  invert: (sx) ->

  v_invert: (sxs) ->

  r_compute: (x0, x1) ->
    if @target_range.is_reversed
      return [@compute(x1), @compute(x0)]
    else
      return [@compute(x0), @compute(x1)]

  r_invert: (sx0, sx1) ->
    if @target_range.is_reversed
      return [@invert(sx1), @invert(sx0)]
    else
      return [@invert(sx0), @invert(sx1)]
