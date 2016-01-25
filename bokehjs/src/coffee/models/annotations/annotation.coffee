_ = require "underscore"
Renderer = require "../renderers/renderer"

class Annotation extends Renderer
  type: 'Annotation'

  defaults: ->
    return _.extend {}, super(), {
      level: 'overlay'
      plot: null
    }

module.exports =
  Model: Annotation
