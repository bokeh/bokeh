import {Scale} from "./scale"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class LogScale extends Scale
  type: "LogScale"

  compute: (x) ->
    [factor, offset, inter_factor, inter_offset] = @_compute_state()

    if inter_factor == 0
      value = 0
    else
      _x = (Math.log(x) - inter_offset) / inter_factor
      if isFinite(_x)
        value = _x * factor + offset
      else
        value = NaN

    return value

  v_compute: (xs) ->
    [factor, offset, inter_factor, inter_offset] = @_compute_state()

    result = new Float64Array(xs.length)

    if inter_factor == 0
      for i in [0...xs.length]
        result[i] = 0
    else
      for i in [0...xs.length]
        _x = (Math.log(xs[i]) - inter_offset) / inter_factor
        if isFinite(_x)
          value = _x * factor + offset
        else
          value = NaN
        result[i] = value

    return result

  invert: (xprime) ->
    [factor, offset, inter_factor, inter_offset] = @_compute_state()
    value = (xprime - offset) / factor
    return Math.exp(inter_factor*value + inter_offset)

  v_invert: (xprimes) ->
    [factor, offset, inter_factor, inter_offset] = @_compute_state()
    result = new Float64Array(xprimes.length)
    for i in [0...xprimes.length]
      value = (xprimes[i] - offset) / factor
      result[i] = Math.exp(inter_factor*value + inter_offset)
    return result

  _get_safe_factor: (orig_start, orig_end) ->
    if orig_start < 0
      start = 0
    else
      start = orig_start

    if orig_end < 0
      end = 0
    else
      end = orig_end

    if start == end
      if start == 0
        [start, end] = [1, 10]
      else
        log_val = Math.log(start) / Math.log(10)
        start = Math.pow(10, Math.floor(log_val))

        if Math.ceil(log_val) != Math.floor(log_val)
          end = Math.pow(10, Math.ceil(log_val))
        else
          end = Math.pow(10, Math.ceil(log_val) + 1)

    return [start, end]

  _compute_state: () ->
    source_start = @source_range.start
    source_end   = @source_range.end
    target_start = @target_range.start
    target_end   = @target_range.end

    screen_range = target_end - target_start
    [start, end] = @_get_safe_factor(source_start, source_end)

    if start == 0
      inter_factor = Math.log(end)
      inter_offset = 0
    else
      inter_factor = Math.log(end) - Math.log(start)
      inter_offset = Math.log(start)

    factor = screen_range
    offset = target_start

    return [factor, offset, inter_factor, inter_offset]
