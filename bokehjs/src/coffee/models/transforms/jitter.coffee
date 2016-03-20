_ = require "underscore"
Transform = require "./transform"

class Jitter extends Transform.Model
  initialize: (attrs, options) ->
    super(attrs, options)

  defaults: ->
    return _.extend {}, super(), {
      interval: [ p.Number, 1]
    }

  compute: (x) ->
    # Apply the transform to a single value
    return(x + ((Math.random() - 0.5) * @get('interval')))

  v_compute: (xs) ->
    # Apply the tranform to a vector of values
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = this.compute(x)
    return result

module.exports =
  Model: Jitter