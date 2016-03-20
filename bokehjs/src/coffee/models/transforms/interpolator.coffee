_ = require "underscore"
Transform = require "./transform"

class Interpolator extends Transform.Model

  initialize: (attrs, options) ->
    super(attrs, options)

  props: ->
    return _.extend {}, super(), {
      x: [ p.String, '']
      y: [ p.String, '']
    }

module.exports =
  Model: Interpolator