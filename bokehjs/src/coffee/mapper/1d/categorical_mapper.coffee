
define [
  "./linear_mapper",
], (LinearMapper) ->

  class CategoricalMapper extends LinearMapper

    map_to_target: (x) ->
      if typeof(x) == 'number'
        return super(x)
      factors = @get('source_range').get('factors')
      if x.indexOf(':') >= 0
        [factor, percent] = x.split(':')
        percent = parseFloat(percent)
        return super(actors.indexOf(factor) + 0.5 + percent)
      return super(factors.indexOf(x) + 1)

    v_map_to_target: (xs) ->
      if typeof(xs[0]) == 'number'
        return super(xs)
      factors = @get('source_range').get('factors')
      results = Array(xs.length)
      for i in [0...xs.length]
        x = xs[i]
        if x.indexOf(':') >= 0
          [factor, percent] = x.split(':')
          percent = parseFloat(percent)
          results[i] = factors.indexOf(factor) + 0.5 + percent
        else
          results[i] = factors.indexOf(x) + 1
      return super(results)

    map_from_target: (xprime) ->
      xprime = super(xprime) - 0.5
      factors = @get('source_range').get('factors')
      return factors[Math.floor(xprime)]

    v_map_from_target: (xprimes) ->
      result = super(xprimes)
      factors = @get('source_range').get('factors')
      for i in [0...result.length]
        result[i] = factors[Math.floor(result[i]-0.5)]
      return result


