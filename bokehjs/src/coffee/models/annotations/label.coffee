_ = require "underscore"
$ = require "jquery"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class LabelView extends Renderer.View
  initialize: (options) ->
    super(options)
    if not @mget('source')?
      this.mset('source', new ColumnDataSource.Model())
    @set_data()

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'data_update', @render)
    else
      @listenTo(@model, 'data_update', @plot_view.request_render)

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))

  _set_data: () ->
    @label_div = ($("<div>").addClass('label').hide() for i in @text)
    @width = (null for i in @text)
    @height = (null for i in @text)
    @x_shift = (null for i in @text)
    @y_shift = (null for i in @text)

    ctx = @plot_view.canvas_view.ctx
    for i in [0...@text.length]
      @visuals.text.set_vectorize(ctx, i)
      @width[i] = ctx.measureText(@text[i]).width
      @height[i] = ctx.measureText(@text[i]).ascent / 1.175
      [ @x_shift[i], @y_shift[i] ] = @_calculate_offset(ctx, @height[i], @width[i])

  _calculate_offset: (ctx, height, width) ->
    if ctx.textAlign == 'left'
      x_shift = 0
    if ctx.textAlign == 'center'
      x_shift = -width / 2
    if ctx.textAlign == 'right'
      x_shift = -width

    if ctx.textBaseline == 'top'
      y_shift = 0.0
    if ctx.textBaseline == 'middle'
      y_shift = -0.5 * height
    if ctx.textBaseline == 'bottom'
      y_shift = -1.0 * height
    if ctx.textBaseline == 'alphabetic'
      y_shift = -0.8 * height
    if ctx.textBaseline == 'hanging'
      y_shift = -0.17 * height

    return [x_shift, y_shift]

  render: () ->
    @map_data()
    if @mget('render_mode') == 'canvas'
      @_canvas_text()
    else
      @_css_text()

  _canvas_text: () ->
    ctx = @plot_view.canvas_view.ctx
    for i in [0...@text.length]
      ctx.save()

      ctx.rotate(@mget('angle'))
      ctx.translate(@sx[i], @sy[i])

      ctx.beginPath()
      ctx.rect(@x_shift[i], @y_shift[i], @width[i], @height[i])

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      if @visuals.text.doit
        @visuals.text.set_vectorize(ctx, i)
        ctx.fillText(@text[i], 0, 0)
      ctx.restore()

  _css_text: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@text.length]
      @visuals.text.set_vectorize(ctx, i)

      if not @label_div[i].style?
        @label_div[i].appendTo(@plot_view.$el.find('div.bk-canvas-overlays')).hide()

      @label_div[i]
        .html(@text[i])
        .css({
          'position': 'absolute'
          'top': "#{@sy[i] + @mget('y_offset') + @y_shift[i]}px"
          'left': "#{@sx[i] + @mget('x_offset') + @x_shift[i]}px"
          # 'background-color': 'rgba(0, 255, 0, 0.2)'
          'font-size': "#{@text_font_size[i]}"
          'font-family': "#{@mget('text_font')}"
          })
        .show()

class Label extends Annotation.Model
  default_view: LabelView

  type: 'LabelAnnotation'

  coords: [ ['x', 'y'] ]
  # mixins: ['text', 'line:border_', 'fill:background_']
  mixins: ['text', 'line', 'fill']

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
    return _.extend {}, super(), {
      #overrides
      border_line_color: 'black'
      background_fill_color: "#ffffff"

    }

module.exports =
  Model: Label
  View: LabelView
