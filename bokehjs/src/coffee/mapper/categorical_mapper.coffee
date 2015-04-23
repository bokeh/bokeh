_ = require "underscore"
LinearMapper = require "./linear_mapper"

class CategoricalMapper extends LinearMapper.Model

  map_to_target: (x, return_synthetic=false) ->
    if _.isNumber(x)
      if return_synthetic
        return x
      else
        return super(x)
    factors = @get('source_range').get('factors')
    if x.indexOf(':') >= 0
      [factor, percent] = x.split(':')
      percent = parseFloat(percent)
      result = factors.indexOf(factor) + 0.5 + percent
    else
      result = factors.indexOf(x) + 1
    if return_synthetic
      return result
    else
      return super(result)

  v_map_to_target: (xs, return_synthetic=false) ->
    if _.isNumber(xs[0])
      if return_synthetic
        return xs
      else
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
    if return_synthetic
      return results
    else
      return super(results)

  map_from_target: (xprime, skip_cat=false) ->
    xprime = super(xprime)
    if skip_cat
      return xprime
    factors = @get('source_range').get('factors')
    return factors[Math.floor(xprime-0.5)]

  v_map_from_target: (xprimes, skip_cat=false) ->
    x = super(xprimes)
    for i in [0...x.length]
      x[i] = x[i]
    if skip_cat
      return x
    result = Array(x)
    factors = @get('source_range').get('factors')
    for i in [0...xprimes.length]
      result[i] = factors[Math.floor(x[i]-0.5)]
    return result

module.exports =
  Model: CategoricalMapper