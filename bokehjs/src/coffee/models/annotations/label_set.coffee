import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {ColumnDataSource} from "../sources/column_data_source"
import {div, show, hide} from "core/dom"
import * as p from "core/properties"
import {isString, isArray} from "core/util/types"

export class LabelSetView extends TextAnnotationView
  initialize: (options) ->
    super(options)

    @set_data(@model.source)

    if @model.render_mode == 'css'
      for i in [0...@_text.length]
        @title_div = div({class: 'bk-annotation-child', style: {display: "none"}})
        @el.appendChild(@title_div)

  connect_signals: () ->
    super()
    if @model.render_mode == 'css'
      # dispatch CSS update immediately
      @connect(@model.change, () ->
        @set_data(@model.source)
        @render())
      @connect(@model.source.streaming, () ->
        @set_data(@model.source)
        @render())
      @connect(@model.source.patching, () ->
        @set_data(@model.source)
        @render())
      @connect(@model.source.change, () ->
        @set_data(@model.source)
        @render())
    else
      @connect(@model.change, () ->
        @set_data(@model.source)
        @plot_view.request_render())
      @connect(@model.source.streaming, () ->
        @set_data(@model.source)
        @plot_view.request_render())
      @connect(@model.source.patching, () ->
        @set_data(@model.source)
        @plot_view.request_render())
      @connect(@model.source.change, () ->
        @set_data(@model.source)
        @plot_view.request_render())

  set_data: (source) ->
    super(source)
    @visuals.warm_cache(source)

  _map_data: () ->
    xscale = @plot_view.frame.xscales[@model.x_range_name]
    yscale = @plot_view.frame.yscales[@model.y_range_name]

    if @model.x_units == "data"
      vx = xscale.v_compute(@_x)
    else
      vx = @_x.slice(0) # make deep copy to not mutate
    sx = @canvas.v_vx_to_sx(vx)

    if @model.y_units == "data"
      vy = yscale.v_compute(@_y)
    else
      vy = @_y.slice(0) # make deep copy to not mutate
    sy = @canvas.v_vy_to_sy(vy)

    return [sx, sy]

  render: () ->
    if not @model.visible and @model.render_mode == 'css'
      hide(@el)
    if not @model.visible
      return
    ctx = @plot_view.canvas_view.ctx

    [sx, sy] = @_map_data()

    if @model.render_mode == 'canvas'
      for i in [0...@_text.length]
        @_v_canvas_text(ctx, i, @_text[i], sx[i] + @_x_offset[i], sy[i] - @_y_offset[i], @_angle[i])
    else
      for i in [0...@_text.length]
        @_v_css_text(ctx, i, @_text[i], sx[i] + @_x_offset[i], sy[i] - @_y_offset[i], @_angle[i])

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

  _v_canvas_text: (ctx, i, text, sx, sy, angle) ->
    @visuals.text.set_vectorize(ctx, i)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)
    ctx.rotate(angle)

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3])

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

  _v_css_text: (ctx, i, text, sx, sy, angle) ->
    el = @el.childNodes[i]
    el.textContent = text

    @visuals.text.set_vectorize(ctx, i)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    # attempt to support vector-style ("8 4 8") line dashing for css mode
    ld = @visuals.border_line.line_dash.value()
    if isArray(ld)
      line_dash = if ld.length < 2 then "solid" else "dashed"
    if isString(ld)
      line_dash = ld

    @visuals.border_line.set_vectorize(ctx, i)
    @visuals.background_fill.set_vectorize(ctx, i)

    el.style.position = 'absolute'
    el.style.left = "#{sx + bbox_dims[0]}px"
    el.style.top = "#{sy + bbox_dims[1]}px"
    el.style.color = "#{@visuals.text.text_color.value()}"
    el.style.opacity = "#{@visuals.text.text_alpha.value()}"
    el.style.font = "#{@visuals.text.font_value()}"
    el.style.lineHeight = "normal" # needed to prevent ipynb css override

    if angle
      el.style.transform = "rotate(#{angle}rad)"

    if @visuals.background_fill.doit
      el.style.backgroundColor = "#{@visuals.background_fill.color_value()}"

    if @visuals.border_line.doit
      el.style.borderStyle = "#{line_dash}"
      el.style.borderWidth = "#{@visuals.border_line.line_width.value()}px"
      el.style.borderColor = "#{@visuals.border_line.color_value()}"

    show(el)

export class LabelSet extends TextAnnotation
  default_view: LabelSetView

  type: 'Label'

  @mixins ['text', 'line:border_', 'fill:background_']

  @define {
    x:            [ p.NumberSpec                      ]
    y:            [ p.NumberSpec                      ]
    x_units:      [ p.SpatialUnits, 'data'            ]
    y_units:      [ p.SpatialUnits, 'data'            ]
    text:         [ p.StringSpec,   { field: "text" } ]
    angle:        [ p.AngleSpec,    0                 ]
    x_offset:     [ p.NumberSpec,   { value: 0 }      ]
    y_offset:     [ p.NumberSpec,   { value: 0 }      ]
    source:       [ p.Instance,     () -> new ColumnDataSource()  ]
    x_range_name: [ p.String,      'default'          ]
    y_range_name: [ p.String,      'default'          ]
    render_mode:  [ p.RenderMode,  'canvas'           ]
  }

  @override {
    background_fill_color: null
    border_line_color: null
  }
