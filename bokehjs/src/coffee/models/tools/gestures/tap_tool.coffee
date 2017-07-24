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

    cb_data =
      geometries: geometry

    if @model.behavior == "select"

      renderers_by_source = @_computed_renderers_by_data_source()

      for _, renderers of renderers_by_source
        sm = renderers[0].get_selection_manager()
        r_views = (@plot_view.renderer_views[r.id] for r in renderers)
        did_hit = sm.select(r_views, geometry, final, append)

        if did_hit and callback?
          cb_data.source = sm.source
          if isFunction(callback)
            callback(@, cb_data)
          else
            callback.execute(@, cb_data)

      @_emit_selection_event(geometry)

      @plot_view.push_state('tap', {selection: @plot_view.get_selection()})

    else # @model.behavior == "inspect"
      for r in @computed_renderers
        sm = r.get_selection_manager()
        did_hit = sm.inspect(@plot_view.renderer_views[r.id], geometry)

        if did_hit and callback?
          cb_data.source = sm.source
          if isFunction(callback)
            callback(@, cb_data)
          else
            callback.execute(@, cb_data)

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
