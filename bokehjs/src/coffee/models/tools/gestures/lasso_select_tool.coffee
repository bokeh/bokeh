import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import * as p from "core/properties"

export class LassoSelectToolView extends SelectToolView

  initialize: (options) ->
    super(options)
    @connect(@model.properties.active.change, () -> @_active_change())
    @data = null

  _active_change: () ->
    if not @model.active
      @_clear_overlay()

  _keyup: (e) ->
    if e.keyCode == 13
      @_clear_overlay()

  _pan_start: (e) ->
    {sx, sy} = e.bokeh
    @data = {sx: [sx], sy: [sy]}
    return null

  _pan: (e) ->
    {sx, sy} = e.bokeh
    [sx, sy] = @plot_model.frame.bbox.clip(sx, sy)

    @data.sx.push(sx)
    @data.sy.push(sy)

    overlay = @model.overlay
    overlay.update({xs: @data.sx, ys: @data.sy})

    if @model.select_every_mousemove
      append = e.srcEvent.shiftKey ? false
      @_do_select(@data.sx, @data.sy, false, append)

  _pan_end: (e) ->
    @_clear_overlay()
    append = e.srcEvent.shiftKey ? false
    @_do_select(@data.sx, @data.sy, true, append)
    @plot_view.push_state('lasso_select', {selection: @plot_view.get_selection()})

  _clear_overlay: () ->
    @model.overlay.update({xs:[], ys:[]})

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
    geometry['sy'] = canvas.v_vy_to_sy(geometry.vy)

    xscale = frame.xscales[r.x_range_name]
    yscale = frame.yscales[r.y_range_name]
    geometry['x'] = xscale.v_invert(geometry.vx)
    geometry['y'] = yscale.v_invert(geometry.vy)

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

export class LassoSelectTool extends SelectTool
  default_view: LassoSelectToolView
  type: "LassoSelectTool"
  tool_name: "Lasso Select"
  icon: "bk-tool-icon-lasso-select"
  event_type: "pan"
  default_order: 12

  @define {
      select_every_mousemove: [ p.Bool,    true                  ]
      callback:               [ p.Instance                       ]
      overlay:                [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }
