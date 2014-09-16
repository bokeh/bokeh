
define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->


  class LogMapper extends HasProperties
    initialize: (attrs, options) ->
      super(attrs, options)

      @register_property('mapper_state', @_mapper_state, true)
      @add_dependencies('mapper_state', this, ['source_range', 'target_range'])
      @add_dependencies('mapper_state', @get('source_range'), ['start', 'end'])
      @add_dependencies('mapper_state', @get('target_range'), ['start', 'end'])

    map_to_target: (x) ->
      [scale, offset, inter_scale, inter_offset] = @get('mapper_state')

      intermediate = 0
      result = 0

      if inter_scale == 0
        intermediate = 0
      else

        try
          intermediate = (Math.log(x) - inter_offset) / inter_scale

          if isNaN(intermediate)
            throw "NaN"
          if isFinite(intermediate) == false
            throw "Infinite"

        catch error
          intermediate = 0

      result = intermediate * scale + offset

      return result

    v_map_to_target: (xs) ->
      [scale, offset, inter_scale, inter_offset] = @get('mapper_state')

      intermediate = new Float64Array(xs.length)
      result = new Float64Array(xs.length)

      if inter_scale == 0
        intermediate = xs.map (i) -> i * 0
      else

        try
          mask1 = xs.map (i) -> i <= 0
          mask2 = xs.map (i) -> isNaN(i)

          mask = (mask1[i] | mask2[i] for i in [0...xs.length])

          mask = mask.reduce (x, y) -> x || y

          if mask == 1
            xs[mask] = 1

          intermediate = xs.map (i) -> (Math.log(i) - inter_offset) / inter_scale

          for x, idx in intermediate
            if isNaN(intermediate[idx])
              throw "NaN"
            if isFinite(intermediate[idx]) == false
              throw "Infinite"

        catch error
          intermediate = xs.map (i) -> i * 0

      for x, idx in xs
        result[idx] = intermediate[idx] * scale + offset

      return result

    map_from_target: (xprime) ->
      [scale, offset, inter_scale, inter_offset] = @get('mapper_state')
      intermediate = (xprime - offset) / scale
      intermediate = Math.exp(inter_scale * intermediate + inter_offset)

      return intermediate

    v_map_from_target: (xprimes) ->
      [scale, offset, inter_scale, inter_offset] = @get('mapper_state')
      intermediate = xprimes.map (i) -> (i - offset) / scale
      intermediate = intermediate.map (i) -> Math.exp(inter_scale * i + inter_offset)

      return intermediate

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
          start = 1
          end = 10
        else
          log_val = Math.log(start) / Math.log(10)
          start = Math.pow(10, Math.floor(log_val))

          if Math.ceil(log_val) != Math.floor(log_val)
            end = Math.pow(10, Math.ceil(log_val))
          else
            end = Math.pow(10, Math.ceil(log_val) + 1)

      return [start, end]

    _mapper_state: () ->

      source_start = @get('source_range').get('start')
      source_end   = @get('source_range').get('end')
      target_start = @get('target_range').get('start')
      target_end   = @get('target_range').get('end')

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

  class LogMappers extends Collection
    model: LogMapper

  return {
    "Model": LogMapper,
    "Collection": new LogMappers()
  }
