import {GestureTool, GestureToolView} from "./gesture_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import * as p from "core/properties"

export class BoxZoomToolView extends GestureToolView

  _match_aspect: (base_point, curpoint, frame) ->

    # aspect ratio of plot frame
    hend = frame.h_range.end
    hstart = frame.h_range.start
    vend = frame.v_range.end
    vstart = frame.v_range.start
    w = hend - hstart
    h = vend - vstart
    a = w/h

    # current aspect of cursor-defined box
    vw = Math.abs(base_point[0]-curpoint[0])
    vh = Math.abs(base_point[1]-curpoint[1])
    if vh == 0
      va = 0
    else
      va = vw/vh

    if va >= a
      [xmod, ymod] = [1, va/a]
    else
      [xmod, ymod] = [a/va, 1]

    # OK the code blocks below merit some explanation. They do:
    #
    # compute left/right, pin to frame if necessary
    # compute top/bottom (based on new left/right), pin to frame if necessary
    # recompute left/right (based on top/bottom), in case top/bottom were pinned

    # base_point[0] is left
    if ( base_point[0] <= curpoint[0] )
      left = base_point[0]
      right = base_point[0] + vw * xmod
      if right > hend
        right = hend
    # base_point[0] is right
    else
      right = base_point[0]
      left = base_point[0] - vw * xmod
      if left < hstart
        left = hstart

    vw = Math.abs(right - left)

    # base_point[1] is bottom
    if ( base_point[1] <= curpoint[1] )
      bottom = base_point[1]
      top = base_point[1] + vw/a
      if top > vend
        top = vend

    # base_point[1] is top
    else
      top = base_point[1]
      bottom = base_point[1] - vw/a
      if bottom < vstart
        bottom = vstart

    vh = Math.abs(top - bottom)

    # base_point[0] is left
    if ( base_point[0] <= curpoint[0] )
      right = base_point[0] + a*vh

    # base_point[0] is right
    else
      left = base_point[0] - a*vh

    return [[left, right], [bottom, top]]

  _pan_start: (e) ->
    canvas = @plot_view.canvas
    @_base_point = [e.bokeh.sx, e.bokeh.sy]
    return null

  _pan: (e) ->
    canvas = @plot_view.canvas
    curpoint = [e.bokeh.sx, e.bokeh.sy]
    frame = @plot_model.frame
    dims = @model.dimensions

    if @model.match_aspect and dims == 'both'
      [sx, sy] = @_match_aspect(@_base_point, curpoint, frame)
    else
      [sx, sy] = @model._get_dim_limits(@_base_point, curpoint, frame, dims)

    @model.overlay.update({left: sx[0], right: sx[1], top: sy[1], bottom: sy[0]})

    return null

  _pan_end: (e) ->
    canvas = @plot_view.canvas
    curpoint = [e.bokeh.sx, e.bokeh.sy]
    frame = @plot_model.frame
    dims = @model.dimensions

    if @model.match_aspect and dims == 'both'
      [sx, sy] = @_match_aspect(@_base_point, curpoint, frame)
    else
      [sx, sy] = @model._get_dim_limits(@_base_point, curpoint, frame, dims)

    @_update(sx, sy)

    @model.overlay.update({left: null, right: null, top: null, bottom: null})
    @_base_point = null
    return null

  _update: (sx, sy) ->
    # If the viewing window is too small, no-op: it is likely that the user did
    # not intend to make this box zoom and instead was trying to cancel out of the
    # zoom, a la matplotlib's ToolZoom. Like matplotlib, set the threshold at 5 pixels.
    if Math.abs(sx[1] - sx[0]) <= 5 or Math.abs(sy[1] - sy[0]) <= 5
      return

    xrs = {}
    for name, scale of @plot_view.frame.xscales
      [start, end] = scale.v_invert(sx)
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, scale of @plot_view.frame.yscales
      [start, end] = scale.v_invert(sy)
      yrs[name] = {start: start, end: end}

    zoom_info = {
      xrs: xrs
      yrs: yrs
    }

    @plot_view.push_state('box_zoom', {range: zoom_info})
    @plot_view.update_range(zoom_info)

DEFAULT_BOX_OVERLAY = () -> new BoxAnnotation({
  level: "overlay"
  render_mode: "css"
  top_units: "screen"
  left_units: "screen"
  bottom_units: "screen"
  right_units: "screen"
  fill_color: {value: "lightgrey"}
  fill_alpha: {value: 0.5}
  line_color: {value: "black"}
  line_alpha: {value: 1.0}
  line_width: {value: 2}
  line_dash: {value: [4, 4]}
})

export class BoxZoomTool extends GestureTool
  default_view: BoxZoomToolView
  type: "BoxZoomTool"
  tool_name: "Box Zoom"
  icon: "bk-tool-icon-box-zoom"
  event_type: "pan"
  default_order: 20

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @dimensions)
  }

  @define {
    dimensions:   [ p.Dimensions, "both"            ]
    overlay:      [ p.Instance, DEFAULT_BOX_OVERLAY ]
    match_aspect: [ p.Bool,     false               ]
  }
