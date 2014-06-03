
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
      dims = @mget('dimensions')
      if dims.length == 0
        console.log ("WARN: wheel zoom tool given empty dimensions")
      else if dims.length == 1
        if dims[0] == 'width'
          @evgen_options.buttonText = "Wheel Zoom (x-axis)"
        else if dims[0] == 'height'
          @evgen_options.buttonText = "Wheel Zoom (y-axis)"
        else
          console.log ("WARN: wheel tool given unrecognized dimensions: #{ dims }")
      else if dims.length == 2
        if dims.indexOf('width') < 0 or dims.indexOf('height') < 0
          console.log ("WARN: pan tool given unrecognized dimensions: #{ dims }")
      else
        console.log ("WARN: wheel tool given more than two dimensions: #{ dims }")


    eventGeneratorClass: OnePointWheelEventGenerator
    evgen_options: { buttonText: "Wheel Zoom" }
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

      dims = @mget('dimensions')

      if dims.indexOf('width') > -1
        sx0 = sx_low  - (sx_low  - x)*factor
        sx1 = sx_high - (sx_high - x)*factor
      else
        sx0 = sx_low
        sx1 = sx_high

      if dims.indexOf('height') > -1
        sy0 = sy_low  - (sy_low  - y)*factor
        sy1 = sy_high - (sy_high - y)*factor
      else
        sy0 = sy_low
        sy1 = sy_high

      xrs = {}
      for name, mapper of @plot_view.x_mappers
        [start, end] = mapper.v_map_from_target([sx0, sx1])
        xrs[name] = {start: start, end: end}

      yrs = {}
      for name, mapper of @plot_view.y_mappers
        [start, end] = mapper.v_map_from_target([sy0, sy1])
        yrs[name] = {start: start, end: end}

      # OK this sucks we can't set factor independently in each direction. It is used
      # for GMap plots, and GMap plots always preserve aspect, so effective the value
      # of 'dimensions' is ignored.
      zoom_info = {
        xrs: xrs
        yrs: yrs
        factor: factor
      }
      @plot_view.update_range(zoom_info)
      return null

  class WheelZoomTool extends Tool.Model
    default_view: WheelZoomToolView
    type: "WheelZoomTool"

    defaults: () ->
      return {
        dimensions: ["width", "height"]
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
