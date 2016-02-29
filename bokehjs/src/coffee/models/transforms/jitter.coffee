_ = require "underscore"
Transform = require "./transform"

class Jitter extends Transform.Model
  initialize: (attrs, options) ->
    super(attrs, options)

  defaults: ->
    return _.extend({}, super(), {
      interval: 1
    })

  compute: (x) ->
    # Apply the transform to a single value
    return(x + ((Math.random() - 0.5) * @get('interval')))

  v_compute: () ->
    # Apply the tranform to a vector of values
    pass

module.exports =
  Model: Jitter