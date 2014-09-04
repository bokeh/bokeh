
define [
  "underscore"
  "backbone"
  "common/logging"
  "./tool"
  "./event_generators"
], (_, Backbone, Logging, Tool, EventGenerators) ->

  OnePointWheelEventGenerator = EventGenerators.OnePointWheelEventGenerator
  logger = Logging.logger

  class WheelZoomToolView extends Tool.View

    initialize: (options) ->
      super(options)
      dims = @mget('dimensions')
      if dims.length == 0
        logger.warn("wheel zoom tool given empty dimensions")
      else if dims.length == 1
        if dims[0] == 'width'
          @evgen_options.buttonText = "Wheel Zoom (x-axis)"
        else if dims[0] == 'height'
          @evgen_options.buttonText = "Wheel Zoom (y-axis)"
        else
          logger.warn("wheel tool given unrecognized dimensions: #{dims}")
      else if dims.length == 2
        if dims.indexOf('width') < 0 or dims.indexOf('height') < 0
          logger.warn("pan tool given unrecognized dimensions: #{dims}")
      else
        logger.warn("wheel tool given more than two dimensions: #{dims}")


    eventGeneratorClass: OnePointWheelEventGenerator
    evgen_options: {
      buttonText: "Wheel Zoom",
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAHFSURBVEiJ7ZbRceIwEIb/vbkCUgIl0EFcAlfBuYOkBHfApALTQUgF0AF0AFcBdPDlwStnsSXD3MA93OSf0ciWdveTrJVkA2RmeqSA/vnHQ0kZfQPvr7igoa0K5enGOBXwzqVOQAvMRkDgCVi60VDvF05j2DLjMwTPe6DDdt5Rx1kBi9A3z8DqEHiX/IEZ0IQJnIBZArYxoDts0qzC+yEDPAXY6PMD82DTJiBAHYLvhkF8xADVYN2SRrMPdk0yill69Hoh6Sxp6/WrJJlZ6o+Be7iZ7UtAjyVJ+jnsMbOVpNWEc/xsx5JRSaN9CLwOMmw54b8PfvWE3Us/wLCGVXBu+0W+HAxAM2jbhCysNNBgAk0W6IZNxjkHjFkI3Z5tvOxCe5eAJWBOOWCAHihrg2f7KGn+Rma2B94kpfXeer2X9GFm6f0+QNdvr9dm9qtkdJfbgu5ESvvzY8o2AidvBb6OrdwGr70+S1pfG508gzZX7NLxlDsvU8K0Od8cMJ2JbSFg2ktNpm8esnFxE9Drhe+ndGk2dPfcoQRzv9b7T1dhCllqZmtgq+7wfvZylvSmLvOOhRh/3G51C9DI/GI8Uv//X9s/B34CxIm8SDsIdkgAAAAASUVORK5CYII="
    }
    tool_events: { zoom: "_zoom" }

    mouse_coords: (e, x, y) ->
      [x_, y_] = [@plot_view.canvas.sx_to_vx(x), @plot_view.canvas.sy_to_vy(y)]
      return [x_, y_]

    _zoom: (e) ->
      # we need a browser-specific multiplier to have similar experiences
      if navigator.userAgent.toLowerCase().indexOf("firefox") > -1
        multiplier = 20
      else
        multiplier = 1

      if e.originalEvent.deltaY?
        delta = -e.originalEvent.deltaY * multiplier
      else
        delta = e.delta

      [x, y]  = @mouse_coords(e, e.bokehX, e.bokehY)
      speed   = @mget('speed')
      factor  = speed * delta

      # clamp the  magnitude of factor, if it is > 1 bad things happen
      if factor > 0.9
        factor = 0.9
      else if factor < -0.9
        factor = -0.9

      xr = @plot_view.frame.get('h_range')
      sx_low  = xr.get('start')
      sx_high = xr.get('end')

      yr = @plot_view.frame.get('v_range')
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
      for name, mapper of @plot_view.frame.get('x_mappers')
        [start, end] = mapper.v_map_from_target([sx0, sx1])
        xrs[name] = {start: start, end: end}

      yrs = {}
      for name, mapper of @plot_view.frame.get('y_mappers')
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
