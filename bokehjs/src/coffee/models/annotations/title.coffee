_ = require "underscore"
$ = require "jquery"

Annotation = require "./annotation"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

{get_text_height} = require "../../core/util/text"

class TitleView extends Renderer.View
  initialize: (options) ->
    super(options)
    @_initialize_properties()

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', @render)
    else
      @listenTo(@model, 'change', @plot_view.request_render)

  _initialize_properties: () ->
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')

    if @mget('render_mode') == 'css'
      @$el.addClass('bk-title')

      @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))

  _computed_location: () ->
    switch @model.panel.side
      when 'left'
        vx = 0
        vy = @_get_text_location(@mget('title_alignment'), 'height') + @mget('title_padding')
      when 'right'
        vx = @canvas.get('right')
        vy = @canvas.get('height') - @_get_text_location(@mget('title_alignment'), 'height') + @mget('title_padding')
      when 'above'
        vx = @_get_text_location(@mget('title_alignment'), 'width') + @mget('title_padding')
        vy = @canvas.get('top')
      when 'below'
        vx = @_get_text_location(@mget('title_alignment'), 'width') + @mget('title_padding')
        vy = 0
    return [vx, vy]

  _get_text_location: (alignment, canvas_dimension) ->
    switch alignment
      when 'left'
        text_location = 0
      when 'center'
        text_location = @canvas.get(canvas_dimension)/2
      when 'right'
        text_location = @canvas.get(canvas_dimension)
    return text_location

  _calculate_text_dimensions: (ctx, text) ->
    @visuals.text.set_value(ctx)
    width = [ctx.measureText(text).width]
    height = [get_text_height(@visuals.text.font_value()).height]
    return [width, height]

  _calculate_rect_offset: (ctx, width, height) ->
    @visuals.text.set_value(ctx)
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

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    @model.panel.apply_label_text_heuristics(ctx, 'justified')
    @mset('text_baseline', ctx.textBaseline)
    @mset('text_align', @mget('title_alignment'))

    angle = @model.panel.get_label_angle_heuristic('parallel')

    [vx, vy] = @_computed_location()

    sx = @canvas.vx_to_sx(vx)
    sy = @canvas.vy_to_sy(vy)

    if @mget('render_mode') == 'canvas'
      @_canvas_text(ctx, @mget('text'), sx, sy, angle)
    else
      @_css_text(ctx, @mget('text'), sx, sy, angle)

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)
    return ctx.measureText(@mget('text')).ascent

  _canvas_text: (ctx, text, sx, sy, angle) ->
    [text_width, text_height] = @_calculate_text_dimensions(ctx, text)
    [ x_rect_offset, y_rect_offset ] = @_calculate_rect_offset(ctx, text_width, text_height)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)
    ctx.rotate(angle)

    ctx.rect(x_rect_offset, y_rect_offset, text_width, text_height)

    if @visuals.background_fill.doit
      @visuals.background_fill.set_value(ctx)
      ctx.fill()

    if @visuals.border_line.doit
      @visuals.border_line.set_value(ctx)
      ctx.stroke()

    if @visuals.text.doit
      @visuals.text.set_value(ctx)
      # ctx.textBaseline = "bottom"
      ctx.fillText(text, 0, 0)

    ctx.restore()

  _css_text: (ctx, text, sx, sy, angle) ->
    [text_width, text_height] = @_calculate_text_dimensions(ctx, text)
    [ x_rect_offset, y_rect_offset ] = @_calculate_rect_offset(ctx, text_width, text_height)

    @visuals.text.set_value(ctx)

    # attempt to support vector-style ("8 4 8") line dashing for css mode
    ld = @visuals.border_line.line_dash.value()
    if _.isArray(ld)
      if ld.length < 2
        line_dash = "solid"
      else
        line_dash = "dashed"
    if _.isString(ld)
        line_dash = ld

    @visuals.border_line.set_value(ctx)
    @visuals.background_fill.set_value(ctx)

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

    @$el.html(text)
        .css(div_style)
        .show()

class Title extends Annotation.Model
  default_view: TitleView

  type: 'Title'

  @mixins ['text', 'line:border_', 'fill:background_']

  @define {
      text:             [ p.String,                      ]
      title_alignment:  [ p.TextAlign,   'center'        ]
      title_padding:    [ p.Number,      0               ]
      render_mode:      [ p.RenderMode,  'canvas'        ]
    }

  @override {
    background_fill_color: null
    border_line_color: null
  }

module.exports =
  Model: Title
  View: TitleView
