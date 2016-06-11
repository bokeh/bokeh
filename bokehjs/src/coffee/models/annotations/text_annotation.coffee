_ = require "underscore"

Annotation = require "./annotation"
p = require "../../core/properties"

{get_text_height} = require "../../core/util/text"

class TextAnnotationView extends Annotation.View
  initialize: (options) ->
    super(options)

    @canvas = @plot_model.get('canvas')
    @frame = @plot_model.get('frame')

    if @mget('render_mode') == 'css'
      @$el.addClass('bk-annotation')
      @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', @render)
    else
      @listenTo(@model, 'change', @plot_view.request_render)

  _calculate_text_dimensions: (ctx, text) ->
    width = ctx.measureText(text).width
    height = get_text_height(@visuals.text.font_value()).height
    return [width, height]

  _calculate_bounding_box_dimensions: (ctx, text) ->
    [width, height] = @_calculate_text_dimensions(ctx, text)

    switch ctx.textAlign
      when 'left' then x_offset = 0
      when 'center' then x_offset = -width / 2
      when 'right' then x_offset = -width

    # guestimated from https://www.w3.org/TR/2dcontext/#dom-context-2d-textbaseline
    switch ctx.textBaseline
      when 'top' then y_offset = 0.0
      when 'middle' then y_offset = -0.5 * height
      when 'bottom' then y_offset = -1.0 * height
      when 'alphabetic' then y_offset = -0.8 * height
      when 'hanging' then y_offset = -0.17 * height
      when 'ideographic' then y_offset = -0.83 * height

    return [x_offset, y_offset, width, height]

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)
    return ctx.measureText(@mget('text')).ascent

  render: () ->
    return null

  _canvas_text: (ctx, text, sx, sy, angle) ->
    @visuals.text.set_value(ctx)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)
    if angle
      ctx.rotate(angle)

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3])

    if @visuals.background_fill.doit
      @visuals.background_fill.set_value(ctx)
      ctx.fill()

    if @visuals.border_line.doit
      @visuals.border_line.set_value(ctx)
      ctx.stroke()

    if @visuals.text.doit
      @visuals.text.set_value(ctx)
      ctx.fillText(text, 0, 0)

    ctx.restore()

  _css_text: (ctx, text, sx, sy, angle) ->
    @$el.hide()

    @visuals.text.set_value(ctx)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    # attempt to support vector string-style ("8 4 8") line dashing for css mode
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
      'left': "#{sx + bbox_dims[0]}px"
      'top': "#{sy + bbox_dims[1]}px"
      'color': "#{@visuals.text.text_color.value()}"
      'opacity': "#{@visuals.text.text_alpha.value()}"
      'font': "#{@visuals.text.font_value()}"
      'line-height': "normal" # needed to prevent ipynb css override
      }

    if angle
      _.extend(div_style, {
        'transform': "rotate(#{angle}rad)"
        })

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

class TextAnnotation extends Annotation.Model
  type: 'TextAnnotation'
  default_view: TextAnnotationView

module.exports =
  Model: TextAnnotation
  View: TextAnnotationView
