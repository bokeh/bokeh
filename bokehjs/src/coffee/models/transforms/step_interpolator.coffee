_ = require "underscore"
Transform = require "./transform"
Interpolator = require "./interpolator"
p = require "../../core/properties"


class StepInterpolator extends Interpolator.Model

  initialize: (attrs, options) ->
    super(attrs, options)

  @define {
      mode: [ p.String, "after"]
    }

  compute: (x) ->
    # Apply the transform to a single value
    @sort(descending = false)

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
      ret = NULL

    return(ret)

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: StepInterpolator