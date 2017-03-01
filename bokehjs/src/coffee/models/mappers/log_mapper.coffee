import {Model} from "../../model"
import * as p from "core/properties"

export class LogMapper extends Model
  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('mapper_state', @_mapper_state, true)
    @add_dependencies('mapper_state', this, ['source_range', 'target_range'])
    @add_dependencies('mapper_state', @source_range, ['start', 'end'])
    @add_dependencies('mapper_state', @target_range, ['start', 'end'])

  @getters {
    mapper_state: () -> @_get_computed('mapper_state')
  }

  map_to_target: (x) ->
    [scale, offset, inter_scale, inter_offset] = @mapper_state

    if inter_scale == 0
      value = 0
    else
      value = (Math.log(x) - inter_offset) / inter_scale
      if isNaN(value) or not isFinite(value)
        value = 0

    return value*scale + offset

  v_map_to_target: (xs) ->
    [scale, offset, inter_scale, inter_offset] = @mapper_state

    result = new Float64Array(xs.length)

    if inter_scale == 0
      for i in [0...xs.length]
        result[i] = 0
    else
      for i in [0...xs.length]
        value = (Math.log(xs[i]) - inter_offset) / inter_scale

        if isNaN(value) or not isFinite(value)
          result[i] = 0
        else
          result[i] = value

    for i in [0...xs.length]
      result[i] = result[i]*scale + offset

    return result

  map_from_target: (xprime) ->
    [scale, offset, inter_scale, inter_offset] = @mapper_state
    value = (xprime - offset) / scale
    return Math.exp(inter_scale*value + inter_offset)

  v_map_from_target: (xprimes) ->
    [scale, offset, inter_scale, inter_offset] = @mapper_state
    result = new Float64Array(xprimes.length)
    for i in [0...xprimes.length]
      value = (xprimes[i] - offset) / scale
      result[i] = Math.exp(inter_scale*value + inter_offset)
    return result

  _get_safe_scale: (orig_start, orig_end) ->
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

  _mapper_state: () ->
    source_start = @source_range.start
    source_end   = @source_range.end
    target_start = @target_range.start
    target_end   = @target_range.end

    screen_range = target_end - target_start
    [start, end] = @_get_safe_scale(source_start, source_end)

    if start == 0
      inter_scale = Math.log(end)
      inter_offset = 0
    else
      inter_scale = Math.log(end) - Math.log(start)
      inter_offset = Math.log(start)

    scale = screen_range
    offset = target_start

    return [scale, offset, inter_scale, inter_offset]

  @internal {
    source_range: [ p.Any ]
    target_range: [ p.Any ]
  }
