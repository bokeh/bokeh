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

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'point'
      vx: vx
      vy: vy
    }

    callback = @mget("callback")

    for r in @mget('computed_renderers')
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderers[r.id], geometry, final, append)
      if callback?
        if _.isFunction(callback)
          callback(ds)
        else
          callback.execute(ds)

    @_save_geometry(geometry, final, append)
    @plot_view.push_state('tap', {selection: @plot_view.get_selection()})

    return null

class TapTool extends SelectTool.Model
  default_view: TapToolView
  type: "TapTool"
  tool_name: "Tap"
  icon: "bk-tool-icon-tap-select"
  event_type: "tap"
  default_order: 10

  @define {
    callback: [ p.Any ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
  }

module.exports =
  Model: TapTool
  View: TapToolView
