_ = require "underscore"
Renderer = require "../renderer"

class Annotation extends Renderer
  type: 'Annotation'

  defaults: ->
    return _.extend {}, super(), {
      level: 'overlay'
      plot: null
    }

module.exports =
  Model: Annotation
