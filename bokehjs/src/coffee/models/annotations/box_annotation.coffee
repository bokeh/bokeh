import {Annotation, AnnotationView} from "./annotation"
import {Signal} from "core/signaling"
import {show, hide} from "core/dom"
import * as p from "core/properties"
import {isString, isArray} from "core/util/types"

export class BoxAnnotationView extends AnnotationView
  initialize: (options) ->
    super(options)
    @plot_view.canvas_overlays.appendChild(@el)
    @el.classList.add("bk-shading")
    hide(@el)

  connect_signals: () ->
    super()
    # need to respond to either normal BB change events or silent
    # "data only updates" that tools might want to use
    if @model.render_mode == 'css'
      # dispatch CSS update immediately
      @connect(@model.change, () -> @render())
      @connect(@model.data_update, () -> @render())
    else
      @connect(@model.change, () => @plot_view.request_render())
      @connect(@model.data_update, () => @plot_view.request_render())

  render: () ->
    if not @model.visible and @model.render_mode == 'css'
      hide(@el)
    if not @model.visible
      return

    # don't render if *all* position are null
    if not @model.left? and not @model.right? and not @model.top? and not @model.bottom?
      hide(@el)
      return null

    frame = @plot_model.frame
    xscale = frame.xscales[@model.x_range_name]
    yscale = frame.yscales[@model.y_range_name]

    _calc_dim = (dim, dim_units, scale, view, frame_extrema) =>
      if dim?
        if @model.screen
          sdim = dim
        else
          if dim_units == 'data'
            sdim = scale.compute(dim)
          else
            sdim = view.compute(dim)
      else
        sdim = frame_extrema
      return sdim

    sleft   = _calc_dim(@model.left,   @model.left_units,   xscale, frame.xview, frame._left.value)
    sright  = _calc_dim(@model.right,  @model.right_units,  xscale, frame.xview, frame._right.value)
    stop    = _calc_dim(@model.top,    @model.top_units,    yscale, frame.yview, frame._top.value)
    sbottom = _calc_dim(@model.bottom, @model.bottom_units, yscale, frame.yview, frame._bottom.value)

    draw = if @model.render_mode == 'css' then @_css_box.bind(@) else @_canvas_box.bind(@)
    draw(sleft, sright, sbottom, stop)

  _css_box: (sleft, sright, sbottom, stop) ->
    sw = Math.abs(sright-sleft)
    sh = Math.abs(sbottom-stop)

    @el.style.left = "#{sleft}px"
    @el.style.width = "#{sw}px"
    @el.style.top = "#{stop}px"
    @el.style.height = "#{sh}px"
    @el.style.borderWidth = "#{@model.line_width.value}px"
    @el.style.borderColor = @model.line_color.value
    @el.style.backgroundColor = @model.fill_color.value
    @el.style.opacity = @model.fill_alpha.value

    # try our best to honor line dashing in some way, if we can
    ld = @model.line_dash
    if isArray(ld)
      ld = if ld.length < 2 then "solid" else "dashed"
    if isString(ld)
      @el.style.borderStyle = ld

    show(@el)

  _canvas_box: (sleft, sright, sbottom, stop) ->
    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    @visuals.fill.set_value(ctx)
    ctx.fill()

    @visuals.line.set_value(ctx)
    ctx.stroke()

    ctx.restore()

export class BoxAnnotation extends Annotation
  default_view: BoxAnnotationView

  type: 'BoxAnnotation'

  @mixins ['line', 'fill']

  @define {
      render_mode:  [ p.RenderMode,   'canvas'  ]
      x_range_name: [ p.String,       'default' ]
      y_range_name: [ p.String,       'default' ]
      top:          [ p.Number,       null      ]
      top_units:    [ p.SpatialUnits, 'data'    ]
      bottom:       [ p.Number,       null      ]
      bottom_units: [ p.SpatialUnits, 'data'    ]
      left:         [ p.Number,       null      ]
      left_units:   [ p.SpatialUnits, 'data'    ]
      right:        [ p.Number,       null      ]
      right_units:  [ p.SpatialUnits, 'data'    ]
  }

  @internal {
    screen: [ p.Boolean, false ]
  }

  @override {
    fill_color: '#fff9ba'
    fill_alpha: 0.4
    line_color: '#cccccc'
    line_alpha: 0.3
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @data_update = new Signal(this, "data_update")

  update: ({left, right, top, bottom}) ->
    @setv({left: left, right: right, top: top, bottom: bottom, screen: true}, {silent: true})
    @data_update.emit()
