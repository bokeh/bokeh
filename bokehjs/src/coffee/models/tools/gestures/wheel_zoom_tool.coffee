import {GestureTool, GestureToolView} from "./gesture_tool"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"

# Here for testing purposes
document = {} unless document?

export class WheelZoomToolView extends GestureToolView

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

    # restrict to axis configured in tool's dimensions property and if
    # zoom origin is inside of frame range/domain
    h_axis = dims in ['width', 'both'] and hr.min < vx < hr.max
    v_axis = dims in ['height', 'both'] and vr.min < vy < vr.max

    factor = @model.speed * e.bokeh.delta

    zoom_info = scale_range(frame, factor, h_axis, v_axis, {x: vx, y: vy})

    @plot_view.push_state('wheel_zoom', {range: zoom_info})
    @plot_view.update_range(zoom_info, false, true)
    @plot_view.interactive_timestamp = Date.now()
    return null

export class WheelZoomTool extends GestureTool
  default_view: WheelZoomToolView
  type: "WheelZoomTool"
  tool_name: "Wheel Zoom"
  icon: "bk-tool-icon-wheel-zoom"
  event_type: if ('ontouchstart' of window or navigator.maxTouchPoints > 0) then 'pinch' else 'scroll'
  default_order: 10

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @dimensions)
  }

  @define {
    dimensions: [ p.Dimensions, "both" ]
  }

  @internal {
    speed: [ p.Number, 1/600 ]
  }
