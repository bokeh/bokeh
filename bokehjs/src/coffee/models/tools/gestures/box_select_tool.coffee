import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import * as p from "core/properties"

export class BoxSelectToolView extends SelectToolView

  _pan_start: (e) ->
    {sx, sy} = e.bokeh
    @_base_point = [sx, sy]
    return null

  _pan: (e) ->
    {sx, sy} = e.bokeh
    curpoint = [sx, sy]

    frame = @plot_model.frame
    dims = @model.dimensions

    [sxlim, sylim] = @model._get_dim_limits(@_base_point, curpoint, frame, dims)
    @model.overlay.update({left: sxlim[0], right: sxlim[1], top: sylim[0], bottom: sylim[1]})

    if @model.select_every_mousemove
      append = e.srcEvent.shiftKey ? false
      @_do_select(sxlim, sylim, false, append)

    return null

  _pan_end: (e) ->
    {sx, sy} = e.bokeh
    curpoint = [sx, sy]

    frame = @plot_model.frame
    dims = @model.dimensions

    [sxlim, sylim] = @model._get_dim_limits(@_base_point, curpoint, frame, dims)
    append = e.srcEvent.shiftKey ? false
    @_do_select(sxlim, sylim, true, append)

    @model.overlay.update({left: null, right: null, top: null, bottom: null})

    @_base_point = null

    @plot_view.push_state('box_select', {selection: @plot_view.get_selection()})

    return null

  _do_select: ([sx0, sx1], [sy0, sy1], final, append=false) ->
    geometry = {
      type: 'rect'
      sx0: sx0
      sx1: sx1
      sy0: sy0
      sy1: sy1
    }
    @_select(geometry, final, append)

  _emit_callback: (geometry) ->
    r = @computed_renderers[0]
    frame = @plot_model.frame

    xscale = frame.xscales[r.x_range_name]
    yscale = frame.yscales[r.y_range_name]

    {sx0, sx1, sy0, sy1} = geometry
    [geometry.x0, geometry.x1] = xscale.r_invert(sx0, sx1)
    [geometry.y0, geometry.y1] = yscale.r_invert(sy0, sy1)

    @model.callback.execute(@model, {geometry: geometry})

    return

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

export class BoxSelectTool extends SelectTool
  default_view: BoxSelectToolView
  type: "BoxSelectTool"
  tool_name: "Box Select"
  icon: "bk-tool-icon-box-select"
  event_type: "pan"
  default_order: 30

  @define {
    dimensions:             [ p.Dimensions, "both"            ]
    select_every_mousemove: [ p. Bool,    false               ]
    callback:               [ p.Instance                      ]
    overlay:                [ p.Instance, DEFAULT_BOX_OVERLAY ]
  }

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @dimensions)
  }
