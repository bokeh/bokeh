_ = require "underscore"

Annotation = require "./annotation"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class LabelView extends Renderer.View
  initialize: (options) ->
    super(options)

class Label extends Annotation.Model
  default_view: LabelView

  type: 'LabelAnnotation'

  mixins: ['text']

  props: ->
    return _.extend {}, super(), {
      render_mode:  [ p.RenderMode,   'canvas'  ]
      x_units:      [ p.SpatialUnits, 'data'    ]
      y_units:      [ p.SpatialUnits, 'data'    ]
      angle:        [ p.AngleSpec               ]
      x_offset:     [ p.Number,       null      ]
      x_offset:     [ p.Number,       null      ]
    }

  defaults: ->
    return _.extend {}, super(), {}

module.exports =
  Model: Label
  View: LabelView
