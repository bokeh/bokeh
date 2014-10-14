
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

  class TapTool extends SelectTool.Model
    default_view: TapToolView
    type: "TapTool"
    tool_name: "Tap"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAMAAAAVv241AAAAA3NCSVQICAjb4U/gAAAA51BMVEX////+/v79/v78/f38/Pz6+/v6+vr4+Pj29/f29vf19fby8/Tx8fLx8vPx8vLw8fLu7+/q6+zm5+jl5+fk5ufj5OXh4+Ti4+Te3+Dd3+Dd3t/a3N7Z29zY2tvX2dvU1tfT1tfS1dbS1NbP0dPO0NLNz9HKzc/Kzc7JzM7Ex8nDx8nDxsjCxsjAxMa/w8TAw8W9wcO8wMK8wMG4u763u722ur23uryytrmztrmxtbivtLavs7aus7WtsrSusrWtsrWssbOssLOrsLKrr7Kmq66lqq2mqq2kqayjqKujqKqip6qip6uhpqmjmdHyAAAATXRSTlMA/////////////////////////////////////////////////////////////////////////////////////////////////////8TzpBEAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAAAnElEQVQImUWO1xbBQBRF7xBEiDJqiF6iRIneSyQmuP//PUYS7Ke9X846AAAVxjTwGdxG/cMi4vk2KCVAPxLuRZu0pvoYTJWHPYwZAJqiznk829km5MRyfs1jtYRN1O5Cb8JDutN48oSGLH7WCo8quSDuZXebntM75CgBN8kV0TnNqHfCxJclfB+xUg0bvgsZCDMrBD86Dv1Hqg7wBukXEhG+uFsTAAAAAElFTkSuQmCC"
    event_type: "tap"
    default_order: 10

  class TapTools extends Collection
    model: TapTool

  return {
    "Model": TapTool,
    "Collection": new TapTools(),
    "View": TapToolView,
  }
