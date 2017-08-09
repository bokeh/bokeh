import {GestureTool, GestureToolView} from "./gesture_tool"
import * as p from "core/properties"

export class WheelPanToolView extends GestureToolView

  _scroll: (e) ->
    factor = @model.speed * e.bokeh.delta

    # clamp the magnitude of factor, if it is > 1 bad things happen
    if factor > 0.9
      factor = 0.9
    else if factor < -0.9
      factor = -0.9

    @_update_ranges(factor)

  _update_ranges: (factor) ->
    frame = @plot_model.frame
    hr = frame.h_range
    vr = frame.v_range

    [vx_low, vx_high] = [hr.start, hr.end]
    [vy_low, vy_high]  = [vr.start, vr.end]

    switch @model.dimension
      when "height"
        vy_range = Math.abs(vy_high - vy_low)
        sx0 = vx_low
        sx1 = vx_high
        sy0 = vy_low + vy_range * factor
        sy1 = vy_high + vy_range * factor
      when "width"
        vx_range = Math.abs(vx_high - vx_low)
        sx0 = vx_low - vx_range * factor
        sx1 = vx_high - vx_range * factor
        sy0 = vy_low
        sy1 = vy_high

    xrs = {}
    for name, scale of frame.xscales
      [start, end] = scale.v_invert([sx0, sx1])
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, scale of frame.yscales
      [start, end] = scale.v_invert([sy0, sy1])
      yrs[name] = {start: start, end: end}

    # OK this sucks we can't set factor independently in each direction. It is used
    # for GMap plots, and GMap plots always preserve aspect, so effective the value
    # of 'dimensions' is ignored.
    pan_info = {
      xrs: xrs
      yrs: yrs
      factor: factor
    }
    @plot_view.push_state('wheel_pan', {range: pan_info})
    @plot_view.update_range(pan_info, false, true)
    @plot_view.interactive_timestamp = Date.now()
    return null


export class WheelPanTool extends GestureTool
  type: 'WheelPanTool'
  default_view: WheelPanToolView
  tool_name: "Wheel Pan"
  icon: "bk-tool-icon-wheel-pan"
  event_type: 'scroll'
  default_order: 12

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @dimension)
  }

  @define {
    dimension: [ p.Dimension, "width" ]
  }

  @internal {
    speed: [ p.Number, 1/1000 ]
  }
