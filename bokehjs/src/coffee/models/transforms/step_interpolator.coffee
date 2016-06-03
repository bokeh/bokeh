_ = require "underscore"
Transform = require "./transform"
Interpolator = require "./interpolator"
p = require "../../core/properties"


class StepInterpolator extends Interpolator.Model

  @define {
    mode: [ p.TransformStepMode, "after"]
    }

  compute: (x) ->
    # Apply the transform to a single value
    @sort(descending = false)

    if @clip == true
      if x < @_x_sorted[0] or x > @_x_sorted[@_x_sorted.length-1]
        return(null)
    else
      if x < @_x_sorted[0]
        return @_y_sorted[0]
      if x > @_x_sorted[@_x_sorted.length-1]
        return @_y_sorted[@_y_sorted.length-1]

    ind = -1
    if @get('mode') == "after"
      ind = _.findLastIndex(@_x_sorted, (num) ->
        return x >= num
      )

    if @get('mode') == "before"
      ind = _.findIndex(@_x_sorted, (num) ->
        return x <= num
      )

    if @get('mode') == "center"
      diffs = (Math.abs(tx - x) for tx in @_x_sorted)
      mdiff = _.min(diffs)
      ind = _.findIndex(diffs, (num) ->
        return mdiff == num
      )

    if ind != -1
      ret = @_y_sorted[ind]
    else
      ret = null

    return(ret)

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: StepInterpolator
