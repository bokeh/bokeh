import {Annotation, AnnotationView} from "./annotation"
import {show, hide} from "core/dom"
import * as p from "core/properties"

export class SpanView extends AnnotationView

  initialize: (options) ->
    super(options)
    @plot_view.canvas_overlays.appendChild(@el)
    @el.style.position = "absolute"
    hide(@el)

  connect_signals: () ->
    super()
    if @model.for_hover
      @connect(@model.properties.computed_location.change, () -> @_draw_span())
    else
      if @model.render_mode == 'canvas'
        @connect(@model.change, () => @plot_view.request_render())
        @connect(@model.properties.location.change, () => @plot_view.request_render())
      else
        @connect(@model.change, () -> @render())
        @connect(@model.properties.location.change, () -> @_draw_span())

  render: () ->
    if not @model.visible and @model.render_mode == 'css'
      hide(@el)
    if not @model.visible
      return
    @_draw_span()

  _draw_span: () ->
    loc = if @model.for_hover then @model.computed_location else @model.location
    if not loc?
      hide(@el)
      return

    frame = @plot_view.frame

    xscale = frame.xscales[@model.x_range_name]
    yscale = frame.yscales[@model.y_range_name]

    if @model.dimension == 'width'
      stop = @_calc_dim(yscale)
      sleft = frame._left.value
      width = frame._width.value
      height = @model.properties.line_width.value()
    else
      stop = frame._top.value
      sleft = @_calc_dim(xscale)
      width = @model.properties.line_width.value()
      height = frame._height.value

    if @model.render_mode == "css"
      @el.style.top = "#{stop}px"
      @el.style.left = "#{sleft}px"
      @el.style.width = "#{width}px"
      @el.style.height = "#{height}px"
      @el.style.zIndex = 1000
      @el.style.backgroundColor = @model.properties.line_color.value()
      @el.style.opacity = @model.properties.line_alpha.value()
      show(@el)

    else if @model.render_mode == "canvas"
      ctx = @plot_view.canvas_view.ctx
      ctx.save()

      ctx.beginPath()
      @visuals.line.set_value(ctx)
      ctx.moveTo(sleft, stop)
      if @model.dimension == "width"
        ctx.lineTo(sleft + width, stop)
      else
        ctx.lineTo(sleft, stop + height)
      ctx.stroke()

      ctx.restore()

  _calc_dim: (scale) ->
    if @model.for_hover
      return @model.computed_location
    else
      vdim = if @model.location_units == 'data' then scale.compute(loc) else loc
      return @plot_view.frame.vx_to_Sx(vdim)

export class Span extends Annotation
  default_view: SpanView

  type: 'Span'

  @mixins ['line']

  @define {
      render_mode:    [ p.RenderMode,   'canvas'  ]
      x_range_name:   [ p.String,       'default' ]
      y_range_name:   [ p.String,       'default' ]
      location:       [ p.Number,       null      ]
      location_units: [ p.SpatialUnits, 'data'    ]
      dimension:      [ p.Dimension,    'width'   ]
  }

  @override {
    line_color: 'black'
  }

  @internal {
    for_hover: [ p.Boolean, false ]
    computed_location: [ p.Number, null ] # absolute screen coordinate
  }
