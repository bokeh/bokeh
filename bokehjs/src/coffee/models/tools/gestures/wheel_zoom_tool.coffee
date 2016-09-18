_ = require "underscore"

GestureTool = require "./gesture_tool"
ZoomUtil = require "../../../util/zoom"
p = require "../../../core/properties"

# Here for testing purposes
document = {} unless document?

class WheelZoomToolView extends GestureTool.View

  _pinch: (e) ->
    # TODO (bev) this can probably be done much better
    if e.scale >= 1
      delta = (e.scale - 1) * 20.0
    else
      delta = -20.0/e.scale
    e.bokeh.delta = delta
    @_scroll(e)

  _scroll: (e) ->
    frame = @plot_model.frame
    hr = frame.h_range
    vr = frame.v_range

    vx = @plot_view.canvas.sx_to_vx(e.bokeh.sx)
    vy = @plot_view.canvas.sy_to_vy(e.bokeh.sy)

    # if wheel-scroll events happen outside frame restrict scaling to axis in bounds
    if vx < hr.start or vx > hr.end
      v_axis_only = true
    if vy < vr.start or vy > vr.end
      h_axis_only = true

    dims = @model.dimensions

    # restrict to axis configured in tool's dimensions property
    if dims.indexOf('width') == -1
      v_axis_only = true
    if dims.indexOf('height') == -1
      h_axis_only = true

    # we need a browser-specific multiplier to have similar experiences
    if navigator.userAgent.toLowerCase().indexOf("firefox") > -1
      multiplier = 20
    else
      multiplier = 1

    if e.originalEvent?.deltaY?
      delta = -e.originalEvent.deltaY * multiplier
    else
      delta = e.bokeh.delta

    factor  = @model.speed * delta

    zoom_info = ZoomUtil.scale_range({
      frame: frame
      factor: factor
      center: [vx, vy]
      v_axis_only: v_axis_only
      h_axis_only: h_axis_only
    })

    @plot_view.push_state('wheel_zoom', {range: zoom_info})
    @plot_view.update_range(zoom_info, false, true)
    @plot_view.interactive_timestamp = Date.now()
    return null

class WheelZoomTool extends GestureTool.Model
  default_view: WheelZoomToolView
  type: "WheelZoomTool"
  tool_name: "Wheel Zoom"
  icon: "bk-tool-icon-wheel-zoom"
  event_type: if ('ontouchstart' of window or navigator.maxTouchPoints > 0) then 'pinch' else 'scroll'
  default_order: 10

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @_check_dims(@dimensions, "wheel zoom tool"))
  }

  @define {
    dimensions: [ p.Array, ["width", "height"] ]
  }

  @internal {
    speed: [ p.Number, 1/600 ]
  }

module.exports =
  Model: WheelZoomTool
  View: WheelZoomToolView
