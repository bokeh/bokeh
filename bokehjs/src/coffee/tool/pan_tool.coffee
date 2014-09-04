
define [
  "underscore"
  "backbone"
  "common/logging"
  "./tool"
  "./event_generators"
], (_, Backbone, Logging, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator
  logger = Logging.logger

  window.render_count = 0

  class PanToolView extends Tool.View
    initialize: (options) ->
      super(options)
      dims = @mget('dimensions')
      if dims.length == 0
        logger.warn("pan tool given empty dimensions")
      else if dims.length == 1
        if dims[0] == 'width'
          @evgen_options.buttonText = "Pan (x-axis)"
        else if dims[0] == 'height'
          @evgen_options.buttonText = "Pan (y-axis)"
        else
          logger.warn("pan tool given unrecognized dimensions: #{dims}")
      else if dims.length == 2
        if dims.indexOf('width') < 0 or dims.indexOf('height') < 0
          logger.warn("pan tool given unrecognized dimensions: #{dims}")
      else
        logger.warn("pan tool given more than two dimensions: #{dims}")

    bind_bokeh_events: () ->
      super()

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "PanTool"

    evgen_options:
      keyName: null
      buttonText: "Pan"
      buttonHook: "pan"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCRTI5MDhEODIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCRTI5MDhEOTIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkJFMjkwOEQ2MjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFMjkwOEQ3MjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+OXzPwwAAAKNJREFUeNrsVsEKgCAM3cyj0f8fuwT9XdEHrLyVIOKYY4kPPDim0+fenF+3HZi4nhFec+Rs4oCPAALwjDVUsKMWA6DNAFX6YXcMYIERdRWIYBzAZbKYGsSKex6mVUAK8Za0TphgoFTbpSvlx3/I0EQOILO2i/ibegLk/mgVONM4JvuBVizgkGH3XTGrR/xlV0ycbO8qCeMN54wdtVQwSTFwCzAATqEZUn8W8W4AAAAASUVORK5CYII="
      cursor: "move"
      auto_deactivate: true
      restrict_to_innercanvas: true

    tool_events:
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"

    mouse_coords: (e, x, y) ->
      [x_, y_] = [@plot_view.canvas.sx_to_vx(x), @plot_view.canvas.sy_to_vy(y)]
      return [x_, y_]

    _set_base_point: (e) ->
      [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
      return null

    _drag: (e) ->
      [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
      xdiff = x - @x
      ydiff = y - @y
      [@x, @y] = [x, y]

      xr = @plot_view.frame.get('h_range')
      sx_low  = xr.get('start') - xdiff
      sx_high = xr.get('end') - xdiff

      yr = @plot_view.frame.get('v_range')
      sy_low  = yr.get('start') - ydiff
      sy_high = yr.get('end') - ydiff

      dims = @mget('dimensions')

      if dims.indexOf('width') > -1
        xstart = @plot_view.xmapper.map_from_target(sx_low)
        xend   = @plot_view.xmapper.map_from_target(sx_high)
        sdx    = -xdiff
      else
        xstart = @plot_view.xmapper.map_from_target(xr.get('start'))
        xend   = @plot_view.xmapper.map_from_target(xr.get('end'))
        sdx    = 0

      if dims.indexOf('height') > -1
        ystart = @plot_view.ymapper.map_from_target(sy_low)
        yend   = @plot_view.ymapper.map_from_target(sy_high)
        sdy    = ydiff
      else
        ystart = @plot_view.ymapper.map_from_target(yr.get('start'))
        yend   = @plot_view.ymapper.map_from_target(yr.get('end'))
        sdy    = 0

      pan_info = {
        xr: {start: xstart, end: xend}
        yr: {start: ystart, end: yend}
        sdx: sdx
        sdy: sdy
      }

      @plot_view.update_range(pan_info)
      return null

  class PanTool extends Tool.Model
    default_view: PanToolView
    type: "PanTool"

    defaults: () ->
      return {
        dimensions: ["width", "height"]
      }

    display_defaults: () ->
      super()

  class PanTools extends Backbone.Collection
    model: PanTool

  return {
    "Model": PanTool,
    "Collection": new PanTools(),
    "View": PanToolView,
  }
