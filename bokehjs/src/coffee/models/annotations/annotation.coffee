_ = require "underscore"

Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class Annotation extends Renderer.Model
  type: 'Annotation'

  @define {
      plot:  [ p.Instance                  ]
    }

  @override {
    level: 'annotation'
  }

module.exports =
  Model: Annotation
