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
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    @data = {vx: [vx], vy: [vy]}
    return null

  _pan: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    h_range = @plot_model.frame.h_range
    v_range = @plot_model.frame.v_range
    if vx > h_range.end
      vx = h_range.end
    if vx < h_range.start
      vx = h_range.start

    if vy > v_range.end
      vy = v_range.end
    if vy < v_range.start
      vy = v_range.start

    @data.vx.push(vx)
    @data.vy.push(vy)

    overlay = @model.overlay
    overlay.update({xs: @data.vx, ys: @data.vy})

    if @model.select_every_mousemove
      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, false, append)

  _pan_end: (e) ->
    @_clear_overlay()
    append = e.srcEvent.shiftKey ? false
    @_select(@data.vx, @data.vy, true, append)
    @plot_view.push_state('lasso_select', {selection: @plot_view.get_selection()})

  _clear_overlay: () ->
    @model.overlay.update({xs:[], ys:[]})

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'poly'
      vx: vx
      vy: vy
    }

    renderers_by_source = @model._computed_renderers_by_data_source()

    for ds, renderers of renderers_by_source
      sm = renderers[0].data_source.selection_manager
      sm.select(@, (@plot_view.renderer_views[r.id] for r in renderers), geometry, final, append)

    if @model.callback?
      @_emit_callback(geometry)

    @_save_geometry(geometry, final, append)

    return null

  _emit_callback: (geometry) ->
    r = @model.computed_renderers[0]
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
