_ = require "underscore"

Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class Annotation extends Renderer.Model
  type: 'Annotation'

  @define {
      level: [ p.RenderLevel, 'annotation' ]
      plot:  [ p.Instance                  ]
    }

module.exports =
  Model: Annotation
