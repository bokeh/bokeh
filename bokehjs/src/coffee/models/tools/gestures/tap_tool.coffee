import {SelectTool, SelectToolView} from "./select_tool"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export class TapToolView extends SelectToolView

  _tap: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    append = e.srcEvent.shiftKey ? false
    @_select(vx, vy, true, append)

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'point'
      vx: vx
      vy: vy
    }

    callback = @model.callback
    @_save_geometry(geometry, final, append)

    cb_data =
      geometries: @plot_model.plot.tool_events.geometries

    for r in @model.computed_renderers
      ds = r.data_source
      sm = ds.selection_manager

      view = @plot_view.renderer_views[r.id]
      if @model.behavior == "select"
        did_hit = sm.select(@, view, geometry, final, append)
      else
        did_hit = sm.inspect(@, view, geometry, {geometry: geometry})

      if did_hit and callback?
        if isFunction(callback)
          callback(ds, cb_data)
        else
          callback.execute(ds, cb_data)

    if @model.behavior == "select"
      @plot_view.push_state('tap', {selection: @plot_view.get_selection()})

    return null

export class TapTool extends SelectTool
  default_view: TapToolView
  type: "TapTool"
  tool_name: "Tap"
  icon: "bk-tool-icon-tap-select"
  event_type: "tap"
  default_order: 10

  @define {
    behavior: [ p.String, "select" ] # TODO: Enum("select", "inspect")
    callback: [ p.Any ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
  }
