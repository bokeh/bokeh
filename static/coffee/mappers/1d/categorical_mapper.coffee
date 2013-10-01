HasProperties = require('../../base').HasProperties


class CategoricalMapper extends HasProperties
  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('mapper_state', @_scale, true)
    @add_dependencies('mapper_state', @get('source_range'), @target_range)
    @add_dependencies('mapper_state', @get('source_range'), 'values')
    @add_dependencies('mapper_state', @get('target_range'), ['start', 'end'])

  map_to_target: (x) ->
    [scale_factor, offset] = @get('mapper_state')
    values = @get('source_range').get('values')
    return scale * _.indexOf(values, x) + offset

  v_map_to_target: (xs) ->
    [scale, offset] = @get('mapper_state')
    values = @get('source_range').get('values')
    result = new Float32Array(xs.length)
    for x, idx in xs
      result[idx] = scale * _.indexOf(values, x) + offset
    return result

  map_from_target: (xprime) ->
    [scale, offset] = @get('mapper_state')
    values = @get('source_range').get('values')
    return values[Math.trunc((xprime + offset) / scale)]

  v_map_from_target: (xprimes) ->
    [scale, offset] = @get('mapper_state')
    values = @get('source_range').get('values')
    result = new Float32Array(xprimes.length)
    for xprime, idx in xprimes
      result[idx] = values[Math.trunc((xprime + offset) / scale)]
    return result

  target_bin_width: () ->
    return @get('mapper_state')[0]

  _scale: () ->
    target_start = @get('target_range').get('start')
    target_end   = @get('target_range').get('end')
    length       = @get('source_range').get('values').length
    scale = (target_end - target_start)/length
    offset = scale/2
    return [scale, offset]


exports.CategoricalMapper = CategoricalMapper