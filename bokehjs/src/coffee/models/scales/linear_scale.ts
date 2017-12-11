import {Scale} from "./scale"

import * as p from "core/properties"

export class LinearScale extends Scale
  type: "LinearScale"

  compute: (x) ->
    [factor, offset] = @_compute_state()
    return factor * x + offset

  v_compute: (xs) ->
    [factor, offset] = @_compute_state()
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = factor * x + offset
    return result

  invert: (xprime) ->
    [factor, offset] = @_compute_state()
    return (xprime - offset) / factor

  v_invert: (xprimes) ->
    [factor, offset] = @_compute_state()
    result = new Float64Array(xprimes.length)
    for xprime, idx in xprimes
      result[idx] = (xprime - offset) / factor
    return result

  _compute_state: () ->
    #
    #  (t1 - t0)       (t1 - t0)
    #  --------- * x - --------- * s0 + t0
    #  (s1 - s0)       (s1 - s0)
    #
    # [  factor  ]     [    offset    ]
    #
    source_start = @source_range.start
    source_end   = @source_range.end
    target_start = @target_range.start
    target_end   = @target_range.end
    factor = (target_end - target_start)/(source_end - source_start)
    offset = -(factor * source_start) + target_start
    return [factor, offset]
