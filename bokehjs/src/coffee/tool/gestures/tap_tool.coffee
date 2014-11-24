
define [
  "underscore",
  "common/collection",
  "tool/gestures/select_tool",
], (_, Collection, SelectTool) ->

  class TapToolView extends SelectTool.View

    _tap: (e) ->
      canvas = @plot_view.canvas
      vx = canvas.sx_to_vx(e.bokeh.sx)
      vy = canvas.sy_to_vy(e.bokeh.sy)
      append = e.srcEvent.shiftKey ? false
      @_select(vx, vy, append)

    _select: (vx, vy, append) ->
      geometry = {
        type: 'point'
        vx: vx
        vy: vy
      }

      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.select(@, @plot_view.renderers[r.id], geometry, true, append)

      @_save_geometry(geometry, true, append)

      return null

  class TapTool extends SelectTool.Model
    default_view: TapToolView
    type: "TapTool"
    tool_name: "Tap"
    icon: "bk-icon-tap"
    event_type: "tap"
    default_order: 10

  class TapTools extends Collection
    model: TapTool

  return {
    "Model": TapTool,
    "Collection": new TapTools(),
    "View": TapToolView,
  }
