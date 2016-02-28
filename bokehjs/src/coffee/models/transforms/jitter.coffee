_ = require "underscore"
Transform = require "./transform"

class Jitter extends Transform.Model
  initialize: (attrs, options) ->
    super(attrs, options)

  defaults: ->
    return _.extend({}, super(), {
      width: 1
    })

  compute: (x) ->
    # Apply the transform to a single value
    return(x + ((Math.random() - 0.5) * @get('width')))

  v_compute: () ->
    # Apply the tranform to a vector of values
    pass

#  map_to_target: (x) ->
#    # do step transform for one value using @get('points')
#    return(x + ((Math.random() - 0.5) * width))

#  v_map_to_target(xs) ->
#    # do step transform for an array of values using @get('points')

module.exports =
  Model: Jitter