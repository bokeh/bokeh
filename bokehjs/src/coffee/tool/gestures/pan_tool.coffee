_ = require "underscore"
GestureTool = require "./gesture_tool"

class PanToolView extends GestureTool.View

  _pan_start: (e) ->
    @last_dx = 0
    @last_dy = 0
    canvas = @plot_view.canvas
    frame = @plot_view.frame
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not frame.contains(vx, vy)
      hr = frame.get('h_range')
      vr = frame.get('v_range')
      if vx < hr.get('start') or vx > hr.get('end')
        @v_axis_only = true
      if vy < vr.get('start') or vy > vr.get('end')
        @h_axis_only = true
    @plot_view.interactive_timestamp = Date.now()

  _pan: (e) ->
    # TODO (bev) get minus sign from canvas/frame
    @_update(e.deltaX, -e.deltaY)
    @plot_view.interactive_timestamp = Date.now()

  _pan_end: (e) ->
    @h_axis_only = false
    @v_axis_only = false

  _update: (dx, dy) ->
    frame = @plot_view.frame

    new_dx = dx - @last_dx
    new_dy = dy - @last_dy

    hr = _.clone(frame.get('h_range'))
    sx_low  = hr.get('start') - new_dx
    sx_high = hr.get('end') - new_dx

    vr = _.clone(frame.get('v_range'))
    sy_low  = vr.get('start') - new_dy
    sy_high = vr.get('end') - new_dy

    dims = @mget('dimensions')

    if dims.indexOf('width') > -1 and not @v_axis_only
      sx0 = sx_low
      sx1 = sx_high
      sdx = -new_dx
    else
      sx0 = hr.get('start')
      sx1 = hr.get('end')
      sdx = 0

    if dims.indexOf('height') > -1 and not @h_axis_only
      sy0 = sy_low
      sy1 = sy_high
      sdy = new_dy
    else
      sy0 = vr.get('start')
      sy1 = vr.get('end')
      sdy = 0

    @last_dx = dx
    @last_dy = dy

    xrs = {}
    for name, mapper of frame.get('x_mappers')
      [start, end] = mapper.v_map_from_target([sx0, sx1], true)
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, mapper of frame.get('y_mappers')
      [start, end] = mapper.v_map_from_target([sy0, sy1], true)
      yrs[name] = {start: start, end: end}

    pan_info = {
      xrs: xrs
      yrs: yrs
      sdx: sdx
      sdy: sdy
    }

    @plot_view.update_range(pan_info)
    return null

class PanTool extends GestureTool.Model
  default_view: PanToolView
  type: "PanTool"
  tool_name: "Pan"
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCRTI5MDhEODIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCRTI5MDhEOTIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkJFMjkwOEQ2MjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFMjkwOEQ3MjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+OXzPwwAAAKNJREFUeNrsVsEKgCAM3cyj0f8fuwT9XdEHrLyVIOKYY4kPPDim0+fenF+3HZi4nhFec+Rs4oCPAALwjDVUsKMWA6DNAFX6YXcMYIERdRWIYBzAZbKYGsSKex6mVUAK8Za0TphgoFTbpSvlx3/I0EQOILO2i/ibegLk/mgVONM4JvuBVizgkGH3XTGrR/xlV0ycbO8qCeMN54wdtVQwSTFwCzAATqEZUn8W8W4AAAAASUVORK5CYII="
  event_type: "pan"
  default_order: 10

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('tooltip', () ->
        @_get_dim_tooltip(
          "Pan",
          @_check_dims(@get('dimensions'), "pan tool")
        )
      , false)
    @add_dependencies('tooltip', this, ['dimensions'])

  defaults: () ->
    return _.extend({}, super(), {
      dimensions: ["width", "height"]
    })

module.exports =
  Model: PanTool
  View: PanToolView