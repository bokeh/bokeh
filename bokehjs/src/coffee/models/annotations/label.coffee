_ = require "underscore"
$ = require "jquery"

Annotation = require "./annotation"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class LabelView extends Renderer.View
  initialize: (options) ->
    super(options)
    @set_data(@mget('source'))
    @label_div = (null for i in @text)

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'data_update', @render)
    else
      @listenTo(@model, 'data_update', @plot_view.request_render)

  render: () ->
    @map_data() ##unclear why calling this in init returns NaNs

    if @mget('render_mode') == 'canvas'
      @_canvas_text()
    else
      @_css_text()

  _canvas_text: () ->
    ctx = @plot_view.canvas_view.ctx
    for i in [0...@x.length]
      ctx.save()
      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@mget('angle'))

      @visuals.text.set_value(ctx)
      ctx.fillText(@text[i], 0, 0)
      ctx.restore()

  _css_text: () ->
    for i in [0...@text.length]
      if @label_div[i] == null
        @label_div[i] = $("<div>")
          .html(@text[i])
          .addClass('label')
          .css({
            'position': 'absolute'
            'top': "#{@sy[i] + @mget('y_offset')}px"
            'left': "#{@sx[i] + @mget('x_offset')}px"
            # 'background-color': 'rgba(255, 255, 255, 0)'
            'font-size': '9pt'
            'font-family': 'sans-serif'
            })

        overlays = @plot_view.$el.find('div.bk-canvas-events')
        @label_div[i].appendTo(overlays)

      else
        @label_div[i]
          .html(@text[i])
          .css({
            'position': 'absolute'
            'top': "#{@sy[i] + @mget('y_offset')}px"
            'left': "#{@sx[i] + @mget('x_offset')}px"
            # 'background-color': 'rgba(255, 255, 255, 0)'
            'font-size': '9pt'
            'font-family': 'sans-serif'
            })

class Label extends Annotation.Model
  default_view: LabelView

  type: 'LabelAnnotation'

  coords: [ ['x', 'y'] ]
  mixins: ['text']

  props: ->
    return _.extend {}, super(), {
      x_units:      [ p.SpatialUnits, 'data'            ]
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
