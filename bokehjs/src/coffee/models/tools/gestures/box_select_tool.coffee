import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import * as p from "core/properties"

export class BoxSelectToolView extends SelectToolView

  _pan_start: (e) ->
    canvas = @plot_view.canvas
    @_baseboint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    return null

  _pan: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.frame
    dims = @model.dimensions

    [vxlim, vylim] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)
    @model.overlay.update({left: vxlim[0], right: vxlim[1], top: vylim[1], bottom: vylim[0]})

    if @model.select_every_mousemove
      append = e.srcEvent.shiftKey ? false
      @_do_select(vxlim, vylim, false, append)

    return null

  _pan_end: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.frame
    dims = @model.dimensions

    [vxlim, vylim] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)
    append = e.srcEvent.shiftKey ? false
    @_do_select(vxlim, vylim, true, append)

    @model.overlay.update({left: null, right: null, top: null, bottom: null})

    @_baseboint = null

    @plot_view.push_state('box_select', {selection: @plot_view.get_selection()})

    return null

  _do_select: ([vx0, vx1], [vy0, vy1], final, append=false) ->
    geometry = {
      type: 'rect'
      vx0: vx0
      vx1: vx1
      vy0: vy0
      vy1: vy1
    }
    @_select(geometry, final, append)

  _emit_callback: (geometry) ->
    r = @computed_renderers[0]
    canvas = @plot_model.canvas
    frame = @plot_model.frame

    geometry['sx0'] = canvas.vx_to_sx(geometry.vx0)
    geometry['sx1'] = canvas.vx_to_sx(geometry.vx1)
    geometry['sy0'] = canvas.vy_to_sy(geometry.vy0)
    geometry['sy1'] = canvas.vy_to_sy(geometry.vy1)

    xscale = frame.xscales[r.x_range_name]
    yscale = frame.yscales[r.y_range_name]
    geometry['x0'] = xscale.invert(geometry.vx0)
    geometry['x1'] = xscale.invert(geometry.vx1)
    geometry['y0'] = yscale.invert(geometry.vy0)
    geometry['y1'] = yscale.invert(geometry.vy1)

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
