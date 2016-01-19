_ = require "underscore"
Annotation = require "./annotation"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class PolyAnnotationView extends PlotWidget

  initialize: (options) ->
    super(options)
    @line = new properties.Line({obj: @model, prefix: ""})
    @fill = new properties.Fill({obj: @model, prefix: ""})

  bind_bokeh_events: () ->
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

    if @line.do_stroke
      @line.set_value(ctx)
      ctx.stroke()

    if @fill.do_fill
      @fill.set_value(ctx)
      ctx.fill()

class PolyAnnotation extends Annotation.Model
  default_view: PolyAnnotationView
  type: "PolyAnnotation"

  nonserializable_attribute_names: () ->
    super().concat(['silent_update'])

  update:({xs, ys}) ->
    if @get('silent_update')
      @attributes['xs'] = xs
      @attributes['ys'] = ys
    else
      @set({xs: xs, ys: ys})
    @trigger('data_update')

  defaults: () ->
    return _.extend({}, super(), {
      silent_update: false
      plot: null
      xs: []
      ys: []
      xs_units: "data"
      ys_units: "data"
      x_range_name: "default"
      y_range_name: "default"
      level: 'annotation'
      fill_color: "#fff9ba"
      fill_alpha: 0.4
      line_width: 1
      line_color: "#cccccc"
      line_alpha: 0.3
      line_alpha: 0.3
      line_join: 'miter'
      line_cap: 'butt'
      line_dash: []
      line_dash_offset: 0
    })

module.exports =
  Model: PolyAnnotation
  View: PolyAnnotationView
