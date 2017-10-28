import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import * as p from "core/properties"
import {copy} from "core/util/array"

export class PolySelectToolView extends SelectToolView

  initialize: (options) ->
    super(options)
    @connect(@model.properties.active.change, () -> @_active_change())
    @data = {sx: [], sy: []}

  _active_change: () ->
    if not @model.active
      @_clear_data()

  _keyup: (e) ->
    if e.keyCode == 13
      @_clear_data()

  _doubletap: (e)->
    append = e.srcEvent.shiftKey ? false
    @_do_select(@data.sx, @data.sy, true, append)
    @plot_view.push_state('poly_select', {selection: @plot_view.get_selection()})

    @_clear_data()

  _clear_data: () ->
    @data = {sx: [], sy: []}
    @model.overlay.update({xs:[], ys:[]})

  _tap: (e) ->
    {sx, sy} = e.bokeh

    if not frame.bbox.contains(sx, sy)
      return

    @data.sx.push(sx)
    @data.sy.push(sy)

    @model.overlay.update({xs: copy(@data.sx), ys: copy(@data.sy)})

  _do_select: (sx, sy, final, append) ->
    geometry = {
      type: 'poly'
      vx: vx
      vy: vy
    }
    @_select(geometry, final, append)

  _emit_callback: (geometry) ->
    r = @computed_renderers[0]
    canvas = @plot_model.canvas
    frame = @plot_model.frame

    geometry['sx'] = canvas.v_vx_to_sx(geometry.vx)
    geometry['sy'] = canvas.v_vx_to_sx(geometry.vy)

    xscale = frame.xscales[r.x_range_name]
    yscale = frame.yscales[r.y_range_name]
    geometry['x'] = xscale.v_invert(geometry.vx)
    geometry['y'] = xscale.v_invert(geometry.vy)

    @model.callback.execute(@model, {geometry: geometry})

    return

DEFAULT_POLY_OVERLAY = () -> new PolyAnnotation({
  level: "overlay"
  xs_units: "screen"
  ys_units: "screen"
  fill_color: {value: "lightgrey"}
  fill_alpha: {value: 0.5}
  line_color: {value: "black"}
  line_alpha: {value: 1.0}
  line_width: {value: 2}
  line_dash: {value: [4, 4]}
})

export class PolySelectTool extends SelectTool
  default_view: PolySelectToolView
  type: "PolySelectTool"
  tool_name: "Poly Select"
  icon: "bk-tool-icon-polygon-select"
  event_type: "tap"
  default_order: 11

  @define {
      callback:   [ p.Instance                       ]
      overlay:    [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }
