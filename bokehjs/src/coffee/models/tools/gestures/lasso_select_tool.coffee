_ = require "underscore"

SelectTool = require "./select_tool"
PolyAnnotation = require "../../annotations/poly_annotation"
p = require "../../../core/properties"

class LassoSelectToolView extends SelectTool.View

  _clear_overlay: () ->
    @data = null
    @model.overlay.update({xs:[], ys:[]})
    return null

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
    @model.overlay.update({xs: @data.vx, ys: @data.vy})

    if @model.select_every_mousemove
      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, false, append)

    return null

  _pan_end: (e) ->
    append = e.srcEvent.shiftKey ? false
    @_select(@data.vx, @data.vy, true, append)
    @plot_view.push_state('lasso_select', {selection: @plot_view.get_selection()})
    @_clear_overlay()

    return null

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'poly'
      vx: vx
      vy: vy
    }

    if not append
      @model._clear_current_selection()

    for r in @model._get_selectable_renderers()
      r.data_source.selector.select(@, @plot_view.renderer_views[r.id], geometry, final, true)

    cb_data = @model._get_cb_data(geometry)

    if @model.callback?
      @model._emit_callback(cb_data)

    if final
      @model._save_geometry(cb_data, append)

    return null

DEFAULT_POLY_OVERLAY = () -> new PolyAnnotation.Model({
  level: "overlay"
  xs_units: "screen"
  ys_units: "screen"
  fill_color: "lightgrey"
  fill_alpha: 0.5
  line_color: "black"
  line_alpha: 1.0
  line_width: 2
  line_dash: [4, 4]
})

class LassoSelectTool extends SelectTool.Model
  default_view: LassoSelectToolView
  type: "LassoSelectTool"
  tool_name: "Lasso Select"
  icon: "bk-tool-icon-lasso-select"
  event_type: "pan"
  default_order: 12

  @define {
      select_every_mousemove: [ p.Bool,    true                  ]
      overlay:                [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }

module.exports =
  Model: LassoSelectTool
  View: LassoSelectToolView
