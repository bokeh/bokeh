
define [
  "underscore"
  "common/has_parent"
  "common/collection"
  "common/plot_widget"
], (_, HasParent, Collection, PlotWidget) ->

  class PolySelectionView extends PlotWidget

    bind_bokeh_events: () ->
      @listenTo(@model, 'change:data', @plot_view.request_render)

    render: (ctx) ->
      data = _.clone(@mget('data'))
      if _.isEmpty(data)
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
      ctx.stroke()

  class PolySelection extends HasParent
    default_view: PolySelectionView
    type: "PolySelection"

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

