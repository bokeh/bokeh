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
    @canvas = @plot_model.get('canvas')

    if @mget('render_mode') == 'css'
      @$el.addClass('bk-label-parent')

      @label_div = $("<div>").addClass('bk-label-child').hide()
      @label_div.appendTo(@$el)

      @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))

    for name, prop of @visuals
      prop.warm_cache(null)

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

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    # Here because AngleSpec does units tranform and label doesn't support specs
    angle = switch @mget('angle_units')
      when "rad" then -1 * @mget('angle')
      when "deg" then -1 * @mget('angle') * Math.PI/180.0

    switch @model.panel.side
      when 'left'
        vx = 0
        [vy, text_align] = @_get_alignment_values(@mget('title_alignment'), 'height')
        @mset('text_baseline', 'middle')
      when 'right'
        vx = @canvas.get('right')
        [vy, text_align] = @_get_alignment_values(@mget('title_alignment'), 'height')
        @mset('text_baseline', 'middle')
      when 'above'
        [vx, text_align] = @_get_alignment_values(@mget('title_alignment'), 'width')
        vy = @canvas.get('top')
        @mset('text_baseline', 'top')
      when 'below'
        [vx, text_align] = @_get_alignment_values(@mget('title_alignment'), 'width')
        vy = 0
        @mset('text_baseline', 'bottom')

    @mset('text_align', text_align)

    sx = @canvas.vx_to_sx(vx)
    sy = @canvas.vy_to_sy(vy)

    if @mget('render_mode') == 'canvas'
      @_canvas_text(ctx, 0, @mget('text'), sx, sy, angle)
    else
      @_css_text(ctx, 0, @mget('text'), sx, sy, angle)

  _get_alignment_values: (alignment, canvas_dimension) ->
    switch alignment
      when 'left'
        text_location = 0
        text_align = 'left'
      when 'center'
        text_location = @canvas.get(canvas_dimension)/2
        text_align = 'center'
      when 'right'
        text_location = @canvas.get(canvas_dimension)
        text_align = 'right'
    return [text_location, text_align]

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)

    side = @model.panel.side
    if side == "above" or side == "below"
      height = ctx.measureText(@mget('text')).ascent
      return height
    if side == 'left' or side == 'right'
      width = ctx.measureText(@mget('text')).width
      return width

  _canvas_text: (ctx, i, text, sx, sy, angle) ->
    debugger;
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

class Title extends Annotation.Model
  default_view: TitleView

  type: 'Title'

  @mixins ['text', 'line:border_', 'fill:background_']

  @define {
      text:             [ p.String,                      ]
      location:         [ p.Location,    'left'          ]
      title_alignment:  [ p.TextAlign,   'left'          ]
      title_padding:    [ p.Number,      0               ]
      angle:            [ p.Angle,       0               ]
      angle_units:      [ p.AngleUnits,  'rad'           ]
      render_mode:      [ p.RenderMode,  'canvas'        ]
    }

  @override {
    background_fill_color: 'green'
    border_line_color: null
  }

module.exports =
  Model: Title
  View: TitleView
