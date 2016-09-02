_ = require "underscore"

Annotation = require "./annotation"
p = require "../../core/properties"

class PolyAnnotationView extends Annotation.View

  bind_bokeh_events: () ->
    # need to respond to either normal BB change events or silent
    # "data only updates" that tools might want to use
    @listenTo(@model, 'change', @plot_view.request_render)
    @listenTo(@model, 'data_update', @plot_view.request_render)

  render: (ctx) ->
    xs = @mget('xs')
    ys = @mget('ys')

    if xs.length != ys.length
      return null

    if xs.length < 3 or ys.length < 3
      return null

    canvas = @plot_view.canvas
    ctx = @plot_view.canvas_view.ctx

    for i in [0...xs.length]
      if @mget('xs_units') == 'screen'
        vx = xs[i]
      if @mget('ys_units') == 'screen'
        vy = ys[i]
      sx = canvas.vx_to_sx(vx)
      sy = canvas.vy_to_sy(vy)
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

class PolyAnnotation extends Annotation.Model
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

  @override {
    fill_color: "#fff9ba"
    fill_alpha: 0.4
    line_color: "#cccccc"
    line_alpha: 0.3
  }

  update:({xs, ys}) ->
    @set({xs: xs, ys: ys}, {silent: true})
    @trigger('data_update')

module.exports =
  Model: PolyAnnotation
  View: PolyAnnotationView
