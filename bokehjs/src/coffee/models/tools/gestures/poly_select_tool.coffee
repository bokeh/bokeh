import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import * as p from "core/properties"
import {copy} from "core/util/array"

export class PolySelectToolView extends SelectToolView

  initialize: (options) ->
    super(options)
    @connect(@model.properties.active.change, () -> @_active_change())
    @data = {vx: [], vy: []}

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
    @data = {vx: [], vy: []}
    @model.overlay.update({xs:[], ys:[]})

  _tap: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    @data.vx.push(vx)
    @data.vy.push(vy)

    @model.overlay.update({xs: copy(@data.vx), ys: copy(@data.vy)})

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

    @_save_geometry(geometry, final, append)
    @plot_view.push_state('poly_select', {selection: @plot_view.get_selection()})

    return null

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
      overlay: [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }
