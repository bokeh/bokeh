import {Transform} from "../transforms"
import {isNumber} from "core/util/types"

export class Scale extends Transform

  # map to/from methods provided for back compat, should be
  # considered deprecated.

  # TODO (bev) "rest" args can be removed when categoricals fixed up
  map_to_target: (x, rest...) ->
    @compute(x, rest...)

  v_map_to_target: (xs, rest...) ->
    @v_compute(xs, rest...)

  map_from_target: (xprime) ->
    @invert(xprime)

  v_map_from_target: (xprimes) ->
    @v_invert(xprimes)
