HasProperties = require('../../base').HasProperties


class LinearMapper extends HasProperties
  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('mapper_state', @_mapper_state, true)
    @add_dependencies('mapper_state', this, ['source_range', 'target_range'])
    @add_dependencies('mapper_state',
      @get('source_range'), ['start', 'end'])
    @add_dependencies('mapper_state',
      @get('target_range'), ['start', 'end'])

  map_to_target: (x) ->
    [scale, offset] = @get('mapper_state')
    return scale * x + offset

  v_map_to_target: (xs) ->
    [scale, offset] = @get('mapper_state')
    result = new Float32Array(xs.length)
    for x, idx in xs
      result[idx] = scale * x + offset
    return result

  map_from_target: (xprime) ->
    [scale, offset] = @get('mapper_state')
    return (xprime - offset) / scale

  v_map_from_target: (xprimes) ->
    [scale, offset] = @get('mapper_state')
    result = new Float32Array(xprimes.length)
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
    source_start = @get('source_range').get('start')
    source_end   = @get('source_range').get('end')
    target_start = @get('target_range').get('start')
    target_end   = @get('target_range').get('end')
    scale = (target_end - target_start)/(source_end - source_start)
    offset = -(scale * source_start) + target_start
    return [scale, offset]


exports.LinearMapper = LinearMapper