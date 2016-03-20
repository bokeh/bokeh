_ = require "underscore"
Transform = require "./transform"
Interpolator = require "./interpolator"

class StepInterpolator extends Interpolator.Model

  initialize: (attrs, options) ->
    super(attrs, options)

  defaults: ->
    return _.extend({}, super())

  compute: (x) ->
    # Apply the transform to a single value
    @sort(descending = false)

    ind = _.findLastIndex(@_x_sorted, (num) ->
        return x >= num
    )

    alert([@_x_sorted, x, ind])

    ret = @_y_sorted[ind]
    return(ret)

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: StepInterpolator