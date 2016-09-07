_ = require "underscore"

SelectTool = require "./select_tool"
p = require "../../../core/properties"

class TapToolView extends SelectTool.View

  _tap: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    append = e.srcEvent.shiftKey ? false
    @_select(vx, vy, true, append)
    if @model.behavior == "select"
      @plot_view.push_state('tap', {selection: @plot_view.get_selection()})

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'point'
      vx: vx
      vy: vy
    }

    cb_data = @_get_cb_data(geometry)

    for r in @model._get_selectable_renderers()
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.clear(@plot_view.renderer_views[r.id])

    for r in @model._get_selectable_renderers()
      ds = r.get('data_source')
      sm = ds.get('selection_manager')

      view = @plot_view.renderer_views[r.id]
      if @model.behavior == "select"
        did_hit = sm.select(@, view, geometry, final, true)
      else
        did_hit = sm.inspect(@, view, geometry, {geometry: geometry})

        callback = @mget("callback")
      if did_hit and callback?
        callback.execute(ds, cb_data)

    # if @model.callback?
    #   @_emit_callback(cb_data)

    if final
      @_save_geometry(cb_data, append)

    return null

class TapTool extends SelectTool.Model
  default_view: TapToolView
  type: "TapTool"
  tool_name: "Tap"
  icon: "bk-tool-icon-tap-select"
  event_type: "tap"
  default_order: 10

  @define {
    behavior: [ p.String, "select" ] # TODO: Enum("select", "inspect")
  }

module.exports =
  Model: TapTool
  View: TapToolView
