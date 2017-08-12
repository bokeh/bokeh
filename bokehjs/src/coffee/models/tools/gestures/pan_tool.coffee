import {GestureTool, GestureToolView} from "./gesture_tool"
import * as p from "core/properties"

export class PanToolView extends GestureToolView

  _pan_start: (e) ->
    @last_dx = 0
    @last_dy = 0
    canvas = @plot_view.canvas
    frame = @plot_view.frame
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not frame.contains(vx, vy)
      hr = frame.h_range
      vr = frame.v_range
      if vx < hr.start or vx > hr.end
        @v_axis_only = true
      if vy < vr.start or vy > vr.end
        @h_axis_only = true
    @plot_view.interactive_timestamp = Date.now()

  _pan: (e) ->
    # TODO (bev) get minus sign from canvas/frame
    @_update(e.deltaX, -e.deltaY)
    @plot_view.interactive_timestamp = Date.now()

  _pan_end: (e) ->
    @h_axis_only = false
    @v_axis_only = false

    if @pan_info?
      @plot_view.push_state('pan', {range: @pan_info})

  _update: (dx, dy) ->
    frame = @plot_view.frame

    new_dx = dx - @last_dx
    new_dy = dy - @last_dy

    hr = frame.h_range
    sx_low  = hr.start - new_dx
    sx_high = hr.end - new_dx

    vr = frame.v_range
    sy_low  = vr.start - new_dy
    sy_high = vr.end - new_dy

    dims = @model.dimensions

    if (dims == 'width' or dims == 'both') and not @v_axis_only
      sx0 = sx_low
      sx1 = sx_high
      sdx = -new_dx
    else
      sx0 = hr.start
      sx1 = hr.end
      sdx = 0

    if (dims == 'height' or dims == 'both') and not @h_axis_only
      sy0 = sy_low
      sy1 = sy_high
      sdy = new_dy
    else
      sy0 = vr.start
      sy1 = vr.end
      sdy = 0

    @last_dx = dx
    @last_dy = dy

    xrs = {}
    for name, scale of frame.xscales
      [start, end] = scale.v_invert([sx0, sx1])
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, scale of frame.yscales
      [start, end] = scale.v_invert([sy0, sy1])
      yrs[name] = {start: start, end: end}

    @pan_info = {
      xrs: xrs
      yrs: yrs
      sdx: sdx
      sdy: sdy
    }

    @plot_view.update_range(@pan_info, is_panning=true)
    return null

export class PanTool extends GestureTool
  default_view: PanToolView
  type: "PanTool"
  tool_name: "Pan"
  event_type: "pan"
  default_order: 10

  @define {
    dimensions: [ p.Dimensions, "both" ]
  }

  @getters {
    tooltip: () -> @_get_dim_tooltip("Pan", @dimensions)
    icon: () ->
      suffix = switch @dimensions
        when "both"   then "pan"
        when "width"  then "xpan"
        when "height" then "ypan"
      "bk-tool-icon-#{suffix}"
  }
