_ = require "underscore"

Annotation = require "./annotation"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class LabelView extends Renderer.View
  initialize: (options) ->
    super(options)
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.addClass('label')
    @$el.hide()

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'data_update', @render)
    else
      @listenTo(@model, 'data_update', @plot_view.request_render)

  render: () ->
    if @mget('render_mode') == 'css'
      @_css_text()
    else
      @_canvas_text()

  _canvas_text: () ->
    ctx = @plot_view.canvas_view.ctx

    ctx.save()
    ctx.translate(@mget('x')+@mget('x_offset'), @mget('y')+@mget('y_offset'))
    ctx.rotate(@mget('angle'))

    @visuals.text.set_value(ctx)
    # ctx.fillText(@mget('text'), 0, 0)
    ctx.fillText(@mget('text'), 300, 300)
    ctx.restore()

  _css_text: () ->
    console.log('css not implemented')

class Label extends Annotation.Model
  default_view: LabelView

  type: 'LabelAnnotation'

  mixins: ['text']

  props: ->
    return _.extend {}, super(), {
      render_mode:  [ p.RenderMode,   'canvas'  ]
      x_units:      [ p.SpatialUnits, 'data'    ]
      y_units:      [ p.SpatialUnits, 'data'    ]
      angle:        [ p.AngleSpec,    0         ]
      x_offset:     [ p.Number,       0         ]
      y_offset:     [ p.Number,       0         ]
    }

  defaults: ->
    return _.extend {}, super(), {}

module.exports =
  Model: Label
  View: LabelView
