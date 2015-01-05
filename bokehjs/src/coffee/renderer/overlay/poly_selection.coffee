
define [
  "underscore"
  "common/has_parent"
  "common/collection"
  "common/plot_widget"
  "renderer/properties"
], (_, HasParent, Collection, PlotWidget, properties) ->

  class PolySelectionView extends PlotWidget

    initialize: (options) ->
      super(options)
      @props = {
        line: new properties.Line(@)
        fill: new properties.Fill(@)
      }

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
      if @props.line.do_stroke
        @props.line.set(ctx)
        ctx.stroke()
      if @props.fill.do_fill and @mget('auto_close')
        @props.fill.set(ctx)
        ctx.fill()

  class PolySelection extends HasParent
    default_view: PolySelectionView
    type: "PolySelection"

    display_defaults: () ->
      return _.extend({}, super(), {
        fill_color: null
        fill_alpha: 0.2
        line_color: 'grey'
        line_width: 3
        line_alpha: 0.8
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: [4]
        line_dash_offset: 0
      })

    defaults: () ->
      return _.extend({}, super(), {
        level: 'overlay'
        auto_close: true
        data: {}
      })

  class PolySelections extends Collection
    model: PolySelection

  return {
    "Model": PolySelection,
    "Collection": new PolySelections(),
    "View": PolySelectionView
  }

