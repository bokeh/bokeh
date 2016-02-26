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

    @set_data(@mget('source'))

    if @mget('render_mode') == 'css'
      @_css_text()
    else
      @_canvas_text()

  _canvas_text: () ->
    ctx = @plot_view.canvas_view.ctx

    x_offset = @mget('x_offset')
    y_offset = @mget('y_offset')

    [@sx, @sy] = @map_to_screen(_.map(@x, (x) -> x + x_offset),
                                _.map(@y, (y) -> y + y_offset))

    debugger;
    for i in [0...@x.length]
      ctx.save()
      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@mget('angle'))

      @visuals.text.set_value(ctx)
      ctx.fillText(@text[i], 0, 0)
      ctx.restore()

  _css_text: () ->
    console.log('css not implemented')

class Label extends Annotation.Model
  default_view: LabelView

  type: 'LabelAnnotation'

  mixins: ['text']

  props: ->
    return _.extend {}, super(), {
      x:            [ p.NumberSpec                      ]
      x_units:      [ p.SpatialUnits, 'data'            ]
      y:            [ p.NumberSpec                      ]
      y_units:      [ p.SpatialUnits, 'data'            ]
      text:         [ p.StringSpec,   { field :"text" } ]
      angle:        [ p.AngleSpec,    0                 ]
      x_offset:     [ p.Number,       0                 ]
      y_offset:     [ p.Number,       0                 ]
      level:        [ p.RenderLevel, 'overlay'          ]
      source:       [ p.Instance                        ]
      x_range_name: [ p.String,      'default'          ]
      y_range_name: [ p.String,      'default'          ]
      render_mode:  [ p.RenderMode,  'canvas'           ]
    }

  defaults: ->
    return _.extend {}, super(), {}

module.exports =
  Model: Label
  View: LabelView
