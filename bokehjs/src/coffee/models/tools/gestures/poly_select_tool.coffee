_ = require "underscore"

SelectTool = require "./select_tool"
PolyAnnotation = require "../../annotations/poly_annotation"
p = require "../../../core/properties"

class PolySelectToolView extends SelectTool.View

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change:active', @_active_change)
    @data = null

  _active_change: () ->
    if not @model.active
      @_clear_data()

  _keyup: (e) ->
    if e.keyCode == 13
      @_clear_data()

  _doubletap: (e)->
    append = e.srcEvent.shiftKey ? false
    @_select(@data.vx, @data.vy, true, append)
    @plot_view.push_state('poly_select', {selection: @plot_view.get_selection()})
    @_clear_data()
    return null

  _clear_data: () ->
    @data = null
    @model.overlay.update({xs:[], ys:[]})

  _tap: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    if not @data?
      @data = {vx: [vx], vy: [vy]}
      return null

    @data.vx.push(vx)
    @data.vy.push(vy)

    overlay = @model.overlay
    overlay.update({xs: @data.vx, ys: @data.vy})

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
      ds = r.data_source
      sm = ds.selection_manager
      sm.select(@, @plot_view.renderer_views[r.id], geometry, final, true)

    cb_data = @_get_cb_data(geometry)

    if @mget('callback')?
      @_emit_callback(cb_data)

    if final
      @_save_geometry(cb_data, append)

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

class PolySelectTool extends SelectTool.Model
  default_view: PolySelectToolView
  type: "PolySelectTool"
  tool_name: "Poly Select"
  icon: "bk-tool-icon-polygon-select"
  event_type: "tap"
  default_order: 11

  @define {
      overlay: [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }

module.exports =
  Model: PolySelectTool
  View: PolySelectToolView
