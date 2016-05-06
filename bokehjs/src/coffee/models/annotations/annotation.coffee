_ = require "underscore"

SidePanel = require "../../core/layout/side_panel"
p = require "../../core/properties"

Renderer = require "../renderers/renderer"

class Annotation extends Renderer.Model
  type: 'Annotation'

  @define {
      plot:  [ p.Instance                  ]
    }

  @override {
    level: 'annotation'
  }

  add_panel: (side) ->
    @panel = new SidePanel.Model({side: side})
    @panel.attach_document(@document)

module.exports =
  Model: Annotation
