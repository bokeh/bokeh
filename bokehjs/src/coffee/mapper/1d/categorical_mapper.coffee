
define [
  "./linear_mapper",
], (LinearMapper) ->

  class CategoricalMapper extends LinearMapper

    map_to_target: (x) ->
      if typeof(x) == 'number'
        return super(x)
      factors = @get('source_range').get('factors')
      return super(factors.indexOf(x) + 1)

    v_map_to_target: (xs) ->
      if typeof(xs[0]) == 'number'
        return super(xs)
      factors = @get('source_range').get('factors')
      return super(factors.indexOf(x) + 1 for x in xs)

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


