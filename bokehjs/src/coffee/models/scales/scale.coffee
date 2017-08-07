import {Transform} from "../transforms"
import * as p from "core/properties"

export class Scale extends Transform

  @internal {
    source_range: [ p.Any ]
    target_range: [ p.Any ]
  }

  # map to/from methods are deprecated (provided for back compat)

  map_to_target: (x) ->
    @compute(x)

  v_map_to_target: (xs) ->
    @v_compute(xs)

  map_from_target: (xprime) ->
    @invert(xprime)

  v_map_from_target: (xprimes) ->
    @v_invert(xprimes)
