
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  OnePointWheelEventGenerator = EventGenerators.OnePointWheelEventGenerator

  class WheelZoomToolView extends Tool.View

    initialize: (options) ->
      super(options)

    eventGeneratorClass: OnePointWheelEventGenerator
    evgen_options: { buttonText: "WheelZoom" }
    tool_events: { zoom: "_zoom" }

    mouse_coords: (e, x, y) ->
      [x_, y_] = [@plot_view.view_state.sx_to_vx(x), @plot_view.view_state.sy_to_vy(y)]
      return [x_, y_]

    _zoom: (e) ->
      # TODO (bev) fix up the correct way?
      #delta   = e.delta
      delta = e.originalEvent.wheelDelta
      screenX = e.bokehX
      screenY = e.bokehY

      [x, y]  = @mouse_coords(e, screenX, screenY)
      speed   = @mget('speed')
      factor  = speed * delta

      # clamp the  magnitude of factor, if it is > 1 bad things happen
      if factor > 0.9
        factor = 0.9
      else if factor < -0.9
        factor = -0.9

      xr = @plot_view.view_state.get('inner_range_horizontal')
      sx_low  = xr.get('start')
      sx_high = xr.get('end')

      yr = @plot_view.view_state.get('inner_range_vertical')
      sy_low  = yr.get('start')
      sy_high = yr.get('end')

      [xstart, xend] = @plot_view.xmapper.v_map_from_target([
        sx_low  - (sx_low  - x)*factor, sx_high - (sx_high - x)*factor
      ])
      [ystart, yend] = @plot_view.ymapper.v_map_from_target([
        sy_low  - (sy_low  - y)*factor, sy_high - (sy_high - y)*factor
      ])

      zoom_info = {
        xr: {start: xstart, end: xend}
        yr: {start: ystart, end: yend}
        factor: factor
      }
      @plot_view.update_range(zoom_info)
      return null

  class WheelZoomTool extends Tool.Model
    default_view: WheelZoomToolView
    type: "WheelZoomTool"

    defaults: () ->
      return {
        dimensions: []
        speed: 1/600
      }

  class WheelZoomTools extends Backbone.Collection
    model: WheelZoomTool

    display_defaults: () ->
      super()

  return {
    "Model": WheelZoomTool,
    "Collection": new WheelZoomTools(),
    "View": WheelZoomToolView,
  }
