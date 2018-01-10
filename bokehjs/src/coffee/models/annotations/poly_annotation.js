import {Annotation, AnnotationView} from "./annotation"
import {Signal} from "core/signaling"
import * as p from "core/properties"

export class PolyAnnotationView extends AnnotationView

  connect_signals: () ->
    super()
    # need to respond to either normal BB change events or silent
    # "data only updates" that tools might want to use
    @connect(@model.change, () => @plot_view.request_render())
    @connect(@model.data_update, () => @plot_view.request_render())

  render: (ctx) ->
    if not @model.visible
      return

    xs = @model.xs
    ys = @model.ys

    if xs.length != ys.length
      return null

    if xs.length < 3 or ys.length < 3
      return null

    frame = @plot_view.frame
    ctx = @plot_view.canvas_view.ctx

    for i in [0...xs.length]
      if @model.xs_units == 'screen'
        sx = if @model.screen then xs[i] else frame.xview.compute(xs[i])
      if @model.ys_units == 'screen'
        sy = if @model.screen then ys[i] else frame.yview.compute(ys[i])
      if i == 0
        ctx.beginPath()
        ctx.moveTo(sx, sy)
      else
        ctx.lineTo(sx, sy)

    ctx.closePath()

    if @visuals.line.doit
      @visuals.line.set_value(ctx)
      ctx.stroke()

    if @visuals.fill.doit
      @visuals.fill.set_value(ctx)
      ctx.fill()

export class PolyAnnotation extends Annotation
  default_view: PolyAnnotationView

  type: "PolyAnnotation"

  @mixins ['line', 'fill']

  @define {
      xs:           [ p.Array,        []        ]
      xs_units:     [ p.SpatialUnits, 'data'    ]
      ys:           [ p.Array,        []        ]
      ys_units:     [ p.SpatialUnits, 'data'    ]
      x_range_name: [ p.String,       'default' ]
      y_range_name: [ p.String,       'default' ]
  }

  @internal {
    screen: [ p.Boolean, false ]
  }

  @override {
    fill_color: "#fff9ba"
    fill_alpha: 0.4
    line_color: "#cccccc"
    line_alpha: 0.3
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @data_update = new Signal(this, "data_update")

  update: ({xs, ys}) ->
    @setv({xs: xs, ys: ys, screen: true}, {silent: true})
    @data_update.emit()
