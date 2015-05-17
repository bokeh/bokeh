_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"

class BoxSelectionView extends PlotWidget

  initialize: (options) ->
    super(options)
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.addClass('shading')
    @$el.hide()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:data', @_draw_box)

  render: () ->
    @_draw_box()
    return @

  _draw_box: () ->
    data = @mget('data')
    if _.isEmpty(data)
      @$el.hide()
      return

    vxlim = data.vxlim
    vylim = data.vylim

    canvas = @plot_view.canvas
    sx = Math.min(
      canvas.vx_to_sx(vxlim[0]),
      canvas.vx_to_sx(vxlim[1])
    )
    sy = Math.min(
      canvas.vy_to_sy(vylim[0]),
      canvas.vy_to_sy(vylim[1])
    )
    sw = Math.abs(vxlim[1] - vxlim[0])
    sh = Math.abs(vylim[1] - vylim[0])

    style = "left:#{sx}px; width:#{sw}px; top:#{sy}px; height:#{sh}px"
    @$el.attr('style', style)
    @$el.show()

class BoxSelection extends HasParent
  default_view: BoxSelectionView
  type: "BoxSelection"

  defaults: () ->
    return _.extend({}, super(), {
      level: 'overlay'
      data: {}
    })

module.exports =
  Model: BoxSelection
  View: BoxSelectionView
