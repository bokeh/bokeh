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
    @label_div = ($("<div>").addClass('label').hide() for i in @_text)
    @width = (null for i in @_text)
    @height = (null for i in @_text)
    @x_shift = (null for i in @_text)
    @y_shift = (null for i in @_text)

    ld = @mget("border_line_dash")
    if _.isArray(ld)
      if ld.length < 2
        @line_dash = "solid"
      else
        @line_dash = "dashed"
    if _.isString(ld)
        @line_dash = ld

    ctx = @plot_view.canvas_view.ctx
    for i in [0...@_text.length]
      @visuals.text.set_vectorize(ctx, i)
      @width[i] = ctx.measureText(@_text[i]).width
      @height[i] = ctx.measureText(@_text[i]).ascent / 1.175
      [ @x_shift[i], @y_shift[i] ] = @_calculate_offset(ctx, @height[i], @width[i])

  _map_data: () ->
    if @mget('x_units') == "data"
      vx = @xmapper.v_map_to_target(@_x)
    else
      vx = @_x.slice(0) # make deep copy to not mutate
    sx = @canvas.v_vx_to_sx(vx)

    if @mget('y_units') == "data"
      vy = @ymapper.v_map_to_target(@_y)
    else
      vy = @_y.slice(0) # make deep copy to not mutate

    sy = @canvas.v_vy_to_sy(vy)

    return [sx, sy]

  _calculate_offset: (ctx, height, width) ->

    switch ctx.textAlign
      when 'left' then x_shift = 0
      when 'center' then x_shift = -width / 2
      when 'right' then x_shift = -width

    switch ctx.textBaseline
      when 'top' then y_shift = 0.0
      when 'middle' then y_shift = -0.5 * height
      when 'bottom' then y_shift = -1.0 * height
      when 'alphabetic' then y_shift = -0.8 * height
      when 'hanging' then y_shift = -0.17 * height
      when 'ideographic' then y_shift = -0.83 * height

    return [x_shift, y_shift]

  render: () ->
    [@sx, @sy] = @_map_data()
    debugger;
    if @mget('render_mode') == 'canvas'
      @_canvas_text()
    else
      @_css_text()

  _canvas_text: () ->
    ctx = @plot_view.canvas_view.ctx
    for i in [0...@_text.length]
      ctx.save()

      ctx.rotate(@mget('angle'))
      ctx.translate(@sx[i] + @_x_offset[i], @sy[i] + @_y_offset[i])

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
        ctx.fillText(@_text[i], 0, 0)
      ctx.restore()

  _css_text: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@_text.length]
      @visuals.text.set_vectorize(ctx, i)
      @visuals.border_line.set_vectorize(ctx, i)
      @visuals.background_fill.set_vectorize(ctx, i)

      if not @label_div[i].style?
        @label_div[i].appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))

      @label_div[i].hide()

      @label_div[i]
        .html(@_text[i])
        .css({
          'position': 'absolute'
          'top': "#{@sy[i] + @_y_offset[i] + @y_shift[i]}px"
          'left': "#{@sx[i] + @_x_offset[i] + @x_shift[i]}px"
          'color': "#{@_text_color[i]}"
          'opacity': "#{@_text_alpha[i]}"
          'font-size': "#{@_text_font_size[i]}"
          'font-family': "#{@mget('text_font')}"
          'background-color': "#{@visuals.background_fill.color_value()}"
          'border-style': "#{@line_dash}"
          'border-width': "#{@_border_line_width[i]}"
          'border-color': "#{@visuals.border_line.color_value()}"
          })
        .show()

class Label extends Annotation.Model
  default_view: LabelView

  type: 'Label'

  @mixins ['text', 'line:border_', 'fill:background_']

  @define {
      x:            [ p.NumberSpec,                     ]
      x_units:      [ p.SpatialUnits, 'data'            ]
      y:            [ p.NumberSpec,                     ]
      y_units:      [ p.SpatialUnits, 'data'            ]
      text:         [ p.StringSpec,   { field :"text" } ]
      angle:        [ p.AngleSpec,    0                 ]
      x_offset:     [ p.NumberSpec,   { value: 0 }      ]
      y_offset:     [ p.NumberSpec,   { value: 0 }      ]
      source:       [ p.Instance                        ]
      x_range_name: [ p.String,      'default'          ]
      y_range_name: [ p.String,      'default'          ]
      render_mode:  [ p.RenderMode,  'canvas'           ]
    }

  defaults: ->
    return _.extend {}, super(), {
      #overrides
      background_fill_color: "#ffffff"
      background_fill_alpha: 0.0
      border_line_color: 'black'
      border_line_alpha: 0.0
    }

module.exports =
  Model: Label
  View: LabelView
