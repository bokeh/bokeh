_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class PolySelectionView extends PlotWidget

  initialize: (options) ->
    super(options)
    @line = new properties.Line({obj: @model, prefix: ""})
    @fill = new properties.Fill({obj: @model, prefix: ""})

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:data', @plot_view.request_render)

  render: (ctx) ->
    data = _.clone(@mget('data'))
    if _.isEmpty(data) or not data?
      return null

    canvas = @plot_view.canvas
    ctx = @plot_view.canvas_view.ctx

    for i in [0...data.vx.length]
      sx = canvas.vx_to_sx(data.vx[i])
      sy = canvas.vy_to_sy(data.vy[i])
      if i == 0
        ctx.beginPath()
        ctx.moveTo(sx, sy)
      else
        ctx.lineTo(sx, sy)
    if @mget('auto_close')
      ctx.closePath()
    if @line.do_stroke
      @line.set_value(ctx)
      ctx.stroke()
    if @fill.do_fill and @mget('auto_close')
      @fill.set_value(ctx)
      ctx.fill()

class PolySelection extends HasParent
  default_view: PolySelectionView
  type: "PolySelection"

  defaults: () ->
    return _.extend({}, super(), {
      level: 'overlay'
      auto_close: true
      data: {}
    })

module.exports =
  Model: PolySelection
  View: PolySelectionView
