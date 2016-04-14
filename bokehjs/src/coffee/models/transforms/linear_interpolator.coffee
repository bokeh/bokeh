_ = require "underscore"
Transform = require "./transform"
Interpolator = require "./interpolator"

class LinearInterpolator extends Interpolator.Model

  defaults: ->
    return _.extend({}, super())

  compute: (x) ->
    # Apply the transform to a single value
    @sort(descending = false)

    ind = _.findLastIndex(@_x_sorted, (num) ->
      return x >= num
    )

    x1 = @_x_sorted[ind]
    x2 = @_x_sorted[ind+1]
    y1 = @_y_sorted[ind]
    y2 = @_y_sorted[ind+1]

    ret = y1 + (((x-x1) / (x2-x1)) * (y2-y1))
    return(ret)

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: LinearInterpolator