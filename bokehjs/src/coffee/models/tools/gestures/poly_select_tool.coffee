import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import * as p from "core/properties"
import {copy} from "core/util/array"

export class PolySelectToolView extends SelectToolView

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

    @_clear_data()

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
    new_data = {}
    new_data.vx = copy(@data.vx)
    new_data.vy = copy(@data.vy)
    overlay.update({xs: @data.vx, ys: @data.vy})

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'poly'
      vx: vx
      vy: vy
    }

    for r in @model.computed_renderers
      ds = r.data_source
      sm = ds.selection_manager
      sm.select(@, @plot_view.renderer_views[r.id], geometry, final, append)

    @_save_geometry(geometry, final, append)
    @plot_view.push_state('poly_select', {selection: @plot_view.get_selection()})

    return null

DEFAULT_POLY_OVERLAY = () -> new PolyAnnotation({
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

export class PolySelectTool extends SelectTool
  default_view: PolySelectToolView
  type: "PolySelectTool"
  tool_name: "Poly Select"
  icon: "bk-tool-icon-polygon-select"
  event_type: "tap"
  default_order: 11

  @define {
      overlay: [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }
