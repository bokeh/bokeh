
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
      buttonHook: "wheel-zoom"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAgCAYAAABpRpp6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCRTI5MDhEQzIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCRTI5MDhERDIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkJFMjkwOERBMjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFMjkwOERCMjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+sFLapAAAA8xJREFUeNq8WH9k1VEU/+67ecTYxKM8xlJiifKIMUqUKMvy1CqbEmUxJZbSlGXTLBuJpYi18dpqStOzacT+WcTXpkiRUjziETEeY9bnzHm5O53vj/te7fDx3r3fc+/9fM/3nHPPvWWP0mOOIlVAC3AQqOc2SRZ4A9Cg58CSNrj1+FEnSIYfPynHTyOQArYCO/jRPPAJGAcmMM9f87vKfG3AF+AucMAgS5LgRZ4CH/mFrARkieAs8Aw4ASSBckaS++jZLOv6El4HjAKDwPoIa28GXgLdFmQv4WcO2BVBnXTmeIxK+D5wzLGXa8D1CGT78NPPhjFlGnjAmBbPSLefx65IBf+eZZ81hfznIfsr+W0eaACa2G3MhbuAt8CUD1kyRIfongDa4affhW4Nu2Oj0d2Bfg+6Y2UIukr2x4ShkAMOMQlNyLcmgVqj7z2wk17UDDosFOOYMOdPQ+dkyBcZFkb8DGxz2ckTwrKHA8g6HMn7gQWjbzsHqZSUmJ8sej6Cq7WzrhkzKVeYnmSEXSBM6I17RZ+WNWRfJ6z7K2xy1umUc7lGDizIkDL+AsNRXs6U3YpOUrRfWwS01K2noIuLzg+iTcFSiFLKlQPi8+aNAIwri24QlstaEM6JdoIsHBOdiyJl9RntfiXazUljEdJb3IKw1F10Q/Krtin0KaSD5Ido77MYK10sG0S4ByjzwW2LRT3pYlxLRBFpGM91/r9kRJuC/FbEnVEmhEwQYRqw7IMuC8LjnAKllSeBhEI0Qc8U636luWinWxYPqoFCnuxmX16VR9ldCvINqOH/NK5alpe8NY8qL5Nnl/GMFJhU6g2SZtqaw1xCkrss2pGEFhLp0CxuGow83+BDdoDn+FP8hJFeYusNlODL9LI/ubKLRRxDKfamuaNWRBx4o9TI49NDD9yjSdn9NKFa5jTGrdrIKpw1FJCtU8h6Rp/HwbVyBNOOSGtKGHJKtGdAao/NBO4aWrecS9mwQiuU8KLoi1nOEfepQ6TsFXVxnnO0NWFZEdVZjK8RaSgXoHtGbihwh4ViCM+LvhaL8VJ3xscdqnwOCk4xhDNKYNRHPOZfCakbzGOS+SWyloX8KsIj4lNScLwIuTsgsq+ASnFkmor4JdJayopKeEHZGOJ8OzMoatIkF0XvxIm5cGhcUtyhVqlrh4rNNoU8fI+jOCUs3cYIk14L63py9yo2D7fyBZ+t3AGuWgTmiFOCuCIvHuHFo6QbCpxm4GLIxZ+880j/K8Lm593EVZqnXF9N8UXIFt7zgwoeunDZCJzju44M+nKlEP4twAAD1RclkNDukAAAAABJRU5ErkJggg=="
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

    defaults: ->
      _.extend {}, super(), {
        dimensions: ["width", "height"]
        speed: 1/600
      }

  class WheelZoomTools extends Backbone.Collection
    model: WheelZoomTool

  return {
    "Model": WheelZoomTool,
    "Collection": new WheelZoomTools(),
    "View": WheelZoomToolView,
  }
