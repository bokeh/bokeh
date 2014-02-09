
define [
  "common/has_properties",
], (HasProperties) ->


  class CategoricalMapper extends HasProperties
    initialize: (attrs, options) ->
      super(attrs, options)

      @register_property('mapper_state', @_mapper_state, true)
      @add_dependencies('mapper_state', this, ['source_range', 'target_range'])
      @add_dependencies('mapper_state', @get('source_range'), ['start', 'end'])
      @add_dependencies('mapper_state', @get('target_range'), ['start', 'end'])

    map_to_target: (x, pos="center") ->
      [scale, offset] = @get('mapper_state')
      values = @get('source_range').get('values')
      y = 0
      if pos == "min"
        offset = 0
      else if pos == "max"
        offset = 0
        y = 1
      return @get('target_range').get('start') + (values.indexOf(x) + y)* scale + offset

    v_map_to_target: (xs, pos="center") ->
      [scale, offset] = @get('mapper_state')
      result = new Float64Array(xs.length)
      values = @get('source_range').get('values')
      tstart  = @get('target_range').get('start')
      y = 0
      if pos == "min"
        offset = 0
      else if pos == "max"
        offset = 0
        y = 1
      for x, idx in xs
        result[idx] = tstart + (values.indexOf(x) + y) * scale + offset
      return result

    map_from_target: (xprime) ->
      [scale, offset] = @get('mapper_state')
      values = @get('source_range').get('values')
      return values[Math.floor((xprime - @get('target_range').get('start')) / scale)]

    v_map_from_target: (xprimes) ->
      [scale, offset] = @get('mapper_state')
      result = new Array(xprimes.length)
      values = @get('source_range').get('values')
      tstart = @get('target_range').get('start')
      for xprime, idx in xprimes
        result[idx] = values[Math.floor((xprime - tstart) / scale)]
      return result

    _mapper_state: () ->
      target_start = @get('target_range').get('start')
      target_end   = @get('target_range').get('end')
      scale = (target_end - target_start)/@get('source_range').get('values').length
      offset = scale/2.0
      return [scale, offset]

