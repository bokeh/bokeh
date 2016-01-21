_ = require "underscore"
Model = require "../models/model"

class LinearMapper extends Model
  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('mapper_state', @_mapper_state, true)
    @add_dependencies('mapper_state', this, ['source_range', 'target_range'])
    @add_dependencies('mapper_state', @get('source_range'), ['start', 'end'])
    @add_dependencies('mapper_state', @get('target_range'), ['start', 'end'])

  map_to_target: (x) ->
    [scale, offset] = @get('mapper_state')
    return scale * x + offset

  v_map_to_target: (xs) ->
    # Possible inputs are:
    # [1, 2, 3]
    # [1, 2, NaN, 3, 4]
    # [[[1, 2], [3, 4]]]
    # [1, 2, NaN, [[1, 2], [3, 4]]]
    # Note: At the top level items are either a single value or an array of arrays

    [scale, offset] = @get('mapper_state')
    result = []

    for i in [0...xs.length]
      if not _.isArray(xs[i])
        # Handle the easy case where it's a number or a NaN
        result[i] = scale * xs[i] + offset
      else
        # Alternatively the element must be an array of arrays
        if _.every(xs[i], _.isArray)
          outer = []
          for j in [0...xs[i].length]
            inner = []
            for k in [0...xs[i][j].length]
              inner[k] = scale * xs[i][j][k] + offset
            outer[j] = inner
          result[i] = outer
        else
          throw new Error('Invalid data structure passed to v_map_to_target: ' + xs[i])
    return result

  map_from_target: (xprime) ->
    [scale, offset] = @get('mapper_state')
    return (xprime - offset) / scale

  v_map_from_target: (xprimes) ->
    [scale, offset] = @get('mapper_state')
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
    source_start = @get('source_range').get('start')
    source_end   = @get('source_range').get('end')
    target_start = @get('target_range').get('start')
    target_end   = @get('target_range').get('end')
    scale = (target_end - target_start)/(source_end - source_start)
    offset = -(scale * source_start) + target_start
    return [scale, offset]

module.exports =
  Model: LinearMapper
