
define [
  "underscore",
  "common/collection",
  "tool/select_tool",
], (_, Collection, SelectTool) ->

  class TapToolView extends SelectTool.View

    _tap: (e) ->
      @_select(e.centerX, e.centerY, e.shiftKey?)

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

  class TapTool extends SelectTool.Model
    default_view: TapToolView
    type: "TapTool"
    tool_name: "Tap"
    event_type: "tap"

  class TapTools extends Collection
    model: TapTool

  return {
    "Model": TapTool,
    "Collection": new TapTools(),
    "View": TapToolView,
  }
