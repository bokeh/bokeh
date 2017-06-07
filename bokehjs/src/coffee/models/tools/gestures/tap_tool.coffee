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

    if @model.behavior == "select"

      renderers_by_source = @model._computed_renderers_by_data_source()

      for ds_id, renderers of renderers_by_source
        ds = renderers[0].data_source
        sm = renderers[0].data_source.selection_manager
        did_hit = sm.select(@, (@plot_view.renderer_views[r.id] for r in renderers), geometry, final, append)

        if did_hit and callback?
          if isFunction(callback)
            callback(ds, cb_data)
          else
            callback.execute(ds, cb_data)

      @plot_view.push_state('tap', {selection: @plot_view.get_selection()})

    else # @model.behavior == "inspect"
      for r in @model.computed_renderers
        ds = r.data_source
        sm = ds.selection_manager
        view = @plot_view.renderer_views[r.id]
        did_hit = sm.inspect(@, view, geometry, {geometry: geometry})

        if did_hit and callback?
          if isFunction(callback)
            callback(ds, cb_data)
          else
            callback.execute(ds, cb_data)

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
