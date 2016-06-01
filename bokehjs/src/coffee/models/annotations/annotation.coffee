_ = require "underscore"

SidePanel = require "../../core/layout/side_panel"
p = require "../../core/properties"

Renderer = require "../renderers/renderer"

class AnnotationView extends Renderer.View

  _get_panel_offset: () ->
    # Sub-classes may have to implement _get_panel_offset themselves
    # because different renderers draw themselves differently so
    # need the individual classes to determine the correct offset.
    x = @model.panel._left._value
    y = @model.panel._bottom._value
    return {x: x, y: -y}

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
    # If the annotation is in a side panel, we need to set level to overlay, so it is visible.
    @level = 'overlay'

module.exports =
  Model: Annotation
  View: AnnotationView
