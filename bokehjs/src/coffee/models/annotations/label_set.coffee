_ = require "underscore"
$ = require "jquery"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

{get_text_height} = require "../../core/util/text"

class LabelSetView extends Renderer.View
  initialize: (options) ->
    super(options)
    # @_initialize_properties is called by super class
    @_initialize_properties()

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', () ->
        @set_data(@mget('source'))
        @render())
      @listenTo(@mget('source'), 'change', () ->
        @set_data(@mget('source'))
        @render())
    else
      @listenTo(@model, 'change', () ->
        @set_data(@mget('source'))
        @plot_view.request_render())
      @listenTo(@mget('source'), 'change', () ->
        @set_data(@mget('source'))
        @plot_view.request_render())

  _initialize_properties: () ->
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    @set_data(@mget('source'))
    @set_visuals(@mget('source'))

    @$el.addClass('bk-title-parent')

    if @mget('render_mode') == 'css'
      for i in [0...@_text.length]
        @title_div = $("<div>").addClass('bk-title-child').hide()
        @title_div.appendTo(@$el)
      @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))

  _calculate_text_dimensions: (ctx, i, text) ->
    @visuals.text.set_vectorize(ctx, i)
    width = [ctx.measureText(text).width]
    height = [get_text_height(@visuals.text.font_value()).height]
    return [width, height]

  _calculate_rect_offset: (ctx, i, width, height) ->
    @visuals.text.set_vectorize(ctx, i)
    switch ctx.textAlign
      when 'left' then x_shift = 0
      when 'center' then x_shift = -width / 2
      when 'right' then x_shift = -width

    # guestimated from https://www.w3.org/TR/2dcontext/#dom-context-2d-textbaseline
    switch ctx.textBaseline
      when 'top' then y_shift = 0.0
      when 'middle' then y_shift = -0.5 * height
      when 'bottom' then y_shift = -1.0 * height
      when 'alphabetic' then y_shift = -0.8 * height
      when 'hanging' then y_shift = -0.17 * height
      when 'ideographic' then y_shift = -0.83 * height

    return [x_shift, y_shift]

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

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    [sx, sy] = @_map_data()

    if @mget('render_mode') == 'canvas'
      for i in [0...@_text.length]
        @_canvas_text(ctx, i, @_text[i], sx[i] + @_x_offset[i], sy[i] - @_y_offset[i], @_angle[i])
    else
      for i in [0...@_text.length]
        @_css_text(ctx, i, @_text[i], sx[i] + @_x_offset[i], sy[i] - @_y_offset[i], @_angle[i])

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)

    side = @model.panel.side
    if side == "above" or side == "below"
      height = ctx.measureText(@_text[0]).ascent
      return height
    if side == 'left' or side == 'right'
      width = ctx.measureText(@_text[0]).width
      return width

  _canvas_text: (ctx, i, text, sx, sy, angle) ->
    [text_width, text_height] = @_calculate_text_dimensions(ctx, i, text)
    [ x_rect_offset, y_rect_offset ] = @_calculate_rect_offset(ctx, i, text_width, text_height)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)
    ctx.rotate(angle)

    ctx.rect(x_rect_offset, y_rect_offset, text_width, text_height)

    if @visuals.background_fill.doit
      @visuals.background_fill.set_vectorize(ctx, i)
      ctx.fill()

    if @visuals.border_line.doit
      @visuals.border_line.set_vectorize(ctx, i)
      ctx.stroke()

    if @visuals.text.doit
      @visuals.text.set_vectorize(ctx, i)
      ctx.fillText(text, 0, 0)

    ctx.restore()

  _css_text: (ctx, i, text, sx, sy, angle) ->
    [text_width, text_height] = @_calculate_text_dimensions(ctx, i, text)
    [ x_rect_offset, y_rect_offset ] = @_calculate_rect_offset(ctx, i, text_width, text_height)

    @visuals.text.set_vectorize(ctx, i)

    # attempt to support vector-style ("8 4 8") line dashing for css mode
    ld = @visuals.border_line.line_dash.value()
    if _.isArray(ld)
      if ld.length < 2
        line_dash = "solid"
      else
        line_dash = "dashed"
    if _.isString(ld)
        line_dash = ld

    @visuals.border_line.set_vectorize(ctx, i)
    @visuals.background_fill.set_vectorize(ctx, i)

    div_style = {
      'position': 'absolute'
      'left': "#{sx + x_rect_offset}px"
      'top': "#{sy + y_rect_offset}px"
      'color': "#{@visuals.text.text_color.value()}"
      'opacity': "#{@visuals.text.text_alpha.value()}"
      'font-size': "#{@visuals.text.text_font_size.value()}"
      'font-family': "#{@visuals.text.text_font.value()}"
      'background-color': "#{@visuals.background_fill.color_value()}"
      'transform': "rotate(#{angle}rad)"
      'line-height': "normal" # needed to prevent ipynb css override
      }

    switch @visuals.text.text_font_style.value()
      when "bold" then _.extend(div_style, {'font-weight': "bold"})
      when "italic" then _.extend(div_style, {'font_style': "italic"})

    if @visuals.background_fill.doit
      _.extend(div_style, {
        'background-color': "#{@visuals.background_fill.color_value()}"
      })

    if @visuals.border_line.doit
      _.extend(div_style, {
        'border-style': "#{line_dash}"
        'border-width': "#{@visuals.border_line.line_width.value()}"
        'border-color': "#{@visuals.border_line.color_value()}"
      })

    @$el.children().eq(i)
                   .html(text)
                   .css(div_style)
                   .show()

class LabelSet extends Annotation.Model
  default_view: LabelSetView

  type: 'Label'

  @mixins ['text', 'line:border_', 'fill:background_']

  @coords [['x', 'y']]

  @define {
      # x:            [ p.NumberSpec,                     ]
      x_units:      [ p.SpatialUnits, 'data'            ]
      # y:            [ p.NumberSpec,                     ]
      y_units:      [ p.SpatialUnits, 'data'            ]
      text:         [ p.StringSpec,   { field: "text" } ]
      angle:        [ p.AngleSpec,    0                 ]
      x_offset:     [ p.NumberSpec,   { value: 0 }      ]
      y_offset:     [ p.NumberSpec,   { value: 0 }      ]
      source:       [ p.Instance,     () -> new ColumnDataSource.Model()  ]
      x_range_name: [ p.String,      'default'          ]
      y_range_name: [ p.String,      'default'          ]
      render_mode:  [ p.RenderMode,  'canvas'           ]
    }

  @override {
    background_fill_color: null
    border_line_color: null
  }

module.exports =
  Model: LabelSet
  View: LabelSetView
