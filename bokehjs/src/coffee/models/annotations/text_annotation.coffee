import {Annotation, AnnotationView} from "./annotation"
import {show, hide} from "core/dom"
import {isString, isArray} from "core/util/types"
import {get_text_height} from "core/util/text"

export class TextAnnotationView extends AnnotationView
  initialize: (options) ->
    super(options)

    @canvas = @plot_model.canvas
    @frame = @plot_model.frame

    if @model.render_mode == 'css'
      @el.classList.add('bk-annotation')
      @plot_view.canvas_overlays.appendChild(@el)

  connect_signals: () ->
    super()
    if @model.render_mode == 'css'
      # dispatch CSS update immediately
      @connect(@model.change, () -> @render())
    else
      @connect(@model.change, () => @plot_view.request_render())

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
    return ctx.measureText(@model.text).ascent

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
    hide(@el)

    @visuals.text.set_value(ctx)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    # attempt to support vector string-style ("8 4 8") line dashing for css mode
    ld = @visuals.border_line.line_dash.value()
    if isArray(ld)
      if ld.length < 2
        line_dash = "solid"
      else
        line_dash = "dashed"
    if isString(ld)
        line_dash = ld

    @visuals.border_line.set_value(ctx)
    @visuals.background_fill.set_value(ctx)

    @el.style.position = 'absolute'
    @el.style.left = "#{sx + bbox_dims[0]}px"
    @el.style.top = "#{sy + bbox_dims[1]}px"
    @el.style.color = "#{@visuals.text.text_color.value()}"
    @el.style.opacity = "#{@visuals.text.text_alpha.value()}"
    @el.style.font = "#{@visuals.text.font_value()}"
    @el.style.lineHeight = "normal" # needed to prevent ipynb css override

    if angle
      @el.style.transform = "rotate(#{angle}rad)"

    if @visuals.background_fill.doit
      @el.style.backgroundColor = "#{@visuals.background_fill.color_value()}"

    if @visuals.border_line.doit
      @el.style.borderStyle = "#{line_dash}"
      @el.style.borderWidth = "#{@visuals.border_line.line_width.value()}px"
      @el.style.borderColor = "#{@visuals.border_line.color_value()}"

    @el.textContent = text
    show(@el)

export class TextAnnotation extends Annotation
  type: 'TextAnnotation'
  default_view: TextAnnotationView
