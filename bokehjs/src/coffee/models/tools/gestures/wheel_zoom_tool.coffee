_ = require "underscore"

GestureTool = require "./gesture_tool"
{scale_range} = require "../../../util/zoom"
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

    dims = @model.dimensions

    # restrict to axis configured in tool's dimensions property
    v_axis = 'width' in dims
    h_axis = 'height' in dims

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

    zoom_info = scale_range(frame, factor, v_axis=v_axis, h_axis=h_axis, {x: vx, y: vy})

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
