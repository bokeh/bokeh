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

    cb_data = @model._get_cb_data(geometry)

    if not append
      @model._clear_current_selection()

    for r in @model._get_selectable_renderers()
      ds = r.data_source

      view = @plot_view.renderer_views[r.id]
      if @model.behavior == "select"
        did_hit = ds.selector.select(@, view, geometry)
      else
        did_hit = ds.inspector.inspect(@, view, geometry)

        callback = @model.callback
      if did_hit and callback?
        callback.execute(ds, cb_data)

    if @model.callback?
      @model._emit_callback(cb_data)

    if final
      @model._save_geometry(cb_data, append)

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
