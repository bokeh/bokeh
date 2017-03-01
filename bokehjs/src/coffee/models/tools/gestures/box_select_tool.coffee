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
      @_select(vxlim, vylim, false, append)

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
    @_select(vxlim, vylim, true, append)

    @model.overlay.update({left: null, right: null, top: null, bottom: null})

    @_baseboint = null

    @plot_view.push_state('box_select', {selection: @plot_view.get_selection()})

    return null

  _select: ([vx0, vx1], [vy0, vy1], final, append=false) ->
    geometry = {
      type: 'rect'
      vx0: vx0
      vx1: vx1
      vy0: vy0
      vy1: vy1
    }

    for r in @model.computed_renderers
      ds = r.data_source
      sm = ds.selection_manager
      sm.select(@, @plot_view.renderer_views[r.id], geometry, final, append)

    if @model.callback?
      @_emit_callback(geometry)

    @_save_geometry(geometry, final, append)

    return null

  _emit_callback: (geometry) ->
    r = @model.computed_renderers[0]
    canvas = @plot_model.canvas
    frame = @plot_model.frame

    geometry['sx0'] = canvas.vx_to_sx(geometry.vx0)
    geometry['sx1'] = canvas.vx_to_sx(geometry.vx1)
    geometry['sy0'] = canvas.vy_to_sy(geometry.vy0)
    geometry['sy1'] = canvas.vy_to_sy(geometry.vy1)

    xmapper = frame.x_mappers[r.x_range_name]
    ymapper = frame.y_mappers[r.y_range_name]
    geometry['x0'] = xmapper.map_from_target(geometry.vx0)
    geometry['x1'] = xmapper.map_from_target(geometry.vx1)
    geometry['y0'] = ymapper.map_from_target(geometry.vy0)
    geometry['y1'] = ymapper.map_from_target(geometry.vy1)

    @model.callback.execute(@model, {geometry: geometry})

    return

DEFAULT_BOX_OVERLAY = () -> new BoxAnnotation({
  level: "overlay"
  render_mode: "css"
  top_units: "screen"
  left_units: "screen"
  bottom_units: "screen"
  right_units: "screen"
  fill_color: "lightgrey"
  fill_alpha: 0.5
  line_color: "black"
  line_alpha: 1.0
  line_width: 2
  line_dash: [4, 4]
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
