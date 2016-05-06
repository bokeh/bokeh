_ = require "underscore"

SidePanel = require "../../core/layout/side_panel"
p = require "../../core/properties"

Renderer = require "../renderers/renderer"

class AnnotationView extends Renderer.View

  _get_size: () ->
    # Sub-classes should implement _get_size if they want layout on side panels to work.
    return -1

class Annotation extends Renderer.Model
  type: 'Annotation'
  default_view: AnnotationView

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
  View: AnnotationView
