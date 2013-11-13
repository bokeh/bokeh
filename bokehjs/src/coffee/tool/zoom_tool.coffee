
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  OnePointWheelEventGenerator = EventGenerators.OnePointWheelEventGenerator

  class ZoomToolView extends Tool.View

    initialize: (options) ->
      super(options)

    eventGeneratorClass: OnePointWheelEventGenerator
    evgen_options: {buttonText:"Zoom"}
    tool_events: {
      zoom: "_zoom"}

    mouse_coords: (e, x, y) ->
      [x_, y_] = [@plot_view.view_state.device_to_sx(x), @plot_view.view_state.device_to_sy(y)]
      return [x_, y_]

    _zoom: (e) ->
      # TODO (bev) fix up the correct way?
      #delta   = e.delta
      delta = e.originalEvent.wheelDelta
      screenX = e.bokehX
      screenY = e.bokehY

      [x, y]  = @mouse_coords(e, screenX, screenY)
      speed   = @mget('speed')
      factor  = speed * (delta) # * 50)  # TODO

      xr = @plot_view.view_state.get('inner_range_horizontal')
      sx_low  = xr.get('start')
      sx_high = xr.get('end')

      yr = @plot_view.view_state.get('inner_range_vertical')
      sy_low  = yr.get('start')
      sy_high = yr.get('end')

      xstart = @plot_view.xmapper.map_from_target(sx_low  - (sx_low  - x)*factor)
      xend   = @plot_view.xmapper.map_from_target(sx_high - (sx_high - x)*factor)
      ystart = @plot_view.ymapper.map_from_target(sy_low  - (sy_low  - y)*factor)
      yend   = @plot_view.ymapper.map_from_target(sy_high - (sy_high - y)*factor)

      zoom_info = {
        xr: {start: xstart, end: xend}
        yr: {start: ystart, end: yend}
        factor: factor
      }
      @plot_view.update_range(zoom_info)
      return null

  class ZoomTool extends Tool.Model
    default_view: ZoomToolView
    type: "ZoomTool"

    defaults: () ->
      return {
        dimensions: []
        dataranges: []
        speed: 1/600
      }

  class ZoomTools extends Backbone.Collection
    model: ZoomTool

    display_defaults: () ->
      super()

  return {
    "Model": ZoomTool,
    "Collection": new ZoomTools(),
    "View": ZoomToolView,
  }
