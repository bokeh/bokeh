_ = require "underscore"
$ = require "jquery"
katex = require "katex"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class LabelView extends Renderer.View
  initialize: (options) ->
    super(options)
    if not @mget('source')?
      this.mset('source', new ColumnDataSource.Model())
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]
    @set_data()

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', @render)
    else
      @listenTo(@model, 'change', @plot_view.request_render)

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))

  _set_data: () ->
    @label_div = ($("<div>").addClass('label').hide() for i in @text)
    @width = (null for i in @text)
    @height = (null for i in @text)
    @x_shift = (null for i in @text)
    @y_shift = (null for i in @text)

    if @mget('render_mode') == 'latex'
      @computed_text = _.map(@text, (item) ->
        return katex.renderToString(item, {displayMode: true}))
    else
      @computed_text = @text.slice(0) # make deep copy to not mutate

    # Try to partially support line-dashing
    ld = @mget("border_line_dash")
    if _.isArray(ld)
      if ld.length < 2
        @computed_line_dash = "solid"
      else
        @computed_line_dash = "dashed"
    if _.isString(ld)
        @computed_line_dash = ld

    ctx = @plot_view.canvas_view.ctx
    for i in [0...@text.length]
      @visuals.text.set_vectorize(ctx, i)
      @width[i] = ctx.measureText(@text[i]).width
      @height[i] = ctx.measureText(@text[i]).ascent / 1.175
      [ @x_shift[i], @y_shift[i] ] = @_calculate_offset(ctx, @height[i], @width[i])

  _map_data: () ->
    if @mget('x_units') == "data"
      vx = @xmapper.v_map_to_target(@x)
    else
      vx = @x.slice(0) # make deep copy to not mutate
    sx = @canvas.v_vx_to_sx(vx)

    if @mget('y_units') == "data"
      vy = @ymapper.v_map_to_target(@y)
    else
      vy = @y.slice(0) # make deep copy to not mutate

    sy = @canvas.v_vy_to_sy(vy)

    return [sx, sy]

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
    [@sx, @sy] = @_map_data()
    switch @mget('render_mode')
      when "canvas"
        @_canvas_text()
      when "css", "latex"
        @_css_text()

  _canvas_text: () ->
    ctx = @plot_view.canvas_view.ctx
    for i in [0...@text.length]
      ctx.save()

      ctx.rotate(@mget('angle'))
      ctx.translate(@sx[i] + @x_offset[i], @sy[i] + @y_offset[i])

      ctx.beginPath()
      ctx.rect(@x_shift[i], @y_shift[i], @width[i], @height[i])

      if @visuals.background_fill.doit
        @visuals.background_fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.border_line.doit
        @visuals.border_line.set_vectorize(ctx, i)
        ctx.stroke()

      if @visuals.text.doit
        @visuals.text.set_vectorize(ctx, i)
        ctx.fillText(@text[i], 0, 0)
      ctx.restore()

  _css_text: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@text.length]
      @visuals.text.set_vectorize(ctx, i)
      @visuals.border_line.set_vectorize(ctx, i)
      @visuals.background_fill.set_vectorize(ctx, i)

      if not @label_div[i].style?
        @label_div[i].appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
      @label_div[i].hide()

      @label_div[i]
        .html(@computed_text[i])
        .css({
          'position': 'absolute'
          'top': "#{@sy[i] + @y_offset[i] + @y_shift[i]}px"
          'left': "#{@sx[i] + @x_offset[i] + @x_shift[i]}px"
          'color': "#{@text_color[i]}"
          'opacity': "#{@text_alpha[i]}"
          'font-size': "#{@text_font_size[i]}"
          'font-family': "#{@mget('text_font')}"
          'background-color': "#{@visuals.background_fill.color_value()}"
          'border-style': "#{@computed_line_dash}"
          'border-width': "#{@border_line_width[i]}"
          'border-color': "#{@visuals.border_line.color_value()}"
          })
        .show()

class Label extends Annotation.Model
  default_view: LabelView

  type: 'Label'

  @mixins ['text', 'line:border_', 'fill:background_']

  @define {
      x:            [ p.NumberSpec,                     ]
      y:            [ p.NumberSpec,                     ]
      x_units:      [ p.SpatialUnits, 'data'            ]
      y_units:      [ p.SpatialUnits, 'data'            ]
      text:         [ p.StringSpec,   { field :"text" } ]
      angle:        [ p.AngleSpec,    0                 ]
      x_offset:     [ p.NumberSpec,   { value: 0 }      ]
      y_offset:     [ p.NumberSpec,   { value: 0 }      ]
      source:       [ p.Instance                        ]
      x_range_name: [ p.String,      'default'          ]
      y_range_name: [ p.String,      'default'          ]
      render_mode:  [ p.TextRenderMode,  'canvas'       ]
    }

  defaults: ->
    return _.extend {}, super(), {
      #overrides
      background_fill_color: "#ffffff"
      background_fill_alpha: 1.0
      border_line_color: '#ffffff'
      border_line_alpha: 1.0
    }

module.exports =
  Model: Label
  View: LabelView
