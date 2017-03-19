import {Model} from "../../model"
import * as p from "core/properties"

export class LinearMapper extends Model
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
    [scale, offset] = @mapper_state
    return scale * x + offset

  v_map_to_target: (xs) ->
    [scale, offset] = @mapper_state
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = scale * x + offset
    return result

  map_from_target: (xprime) ->
    [scale, offset] = @mapper_state
    return (xprime - offset) / scale

  v_map_from_target: (xprimes) ->
    [scale, offset] = @mapper_state
    result = new Float64Array(xprimes.length)
    for xprime, idx in xprimes
      result[idx] = (xprime - offset) / scale
    return result

  _mapper_state: () ->
    #
    #  (t1 - t0)       (t1 - t0)
    #  --------- * x - --------- * s0 + t0
    #  (s1 - s0)       (s1 - s0)
    #
    # [  scale  ]     [    offset    ]
    #
    source_start = @source_range.start
    source_end   = @source_range.end
    target_start = @target_range.start
    target_end   = @target_range.end
    scale = (target_end - target_start)/(source_end - source_start)
    offset = -(scale * source_start) + target_start
    return [scale, offset]

  @internal {
    source_range: [ p.Any ]
    target_range: [ p.Any ]
  }
