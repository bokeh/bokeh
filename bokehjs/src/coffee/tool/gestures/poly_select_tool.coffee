
define [
  "underscore"
  "common/collection"
  "renderer/overlay/poly_selection"
  "tool/gestures/select_tool"
], (_, Collection, PolySelection, SelectTool) ->

  class PolySelectToolView extends SelectTool.View

    initialize: (options) ->
      super(options)
      @data = null

    _tap: (e) ->
      canvas = @plot_view.canvas
      vx = canvas.sx_to_vx(e.bokeh.sx)
      vy = canvas.sy_to_vy(e.bokeh.sy)

      if not @data?
        @data = {vx: [vx], vy: [vy]}
        return null

      @data.vx.push(vx)
      @data.vy.push(vy)

      overlay = @mget('overlay')
      new_data = {}
      new_data.vx = _.clone(@data.vx)
      new_data.vy = _.clone(@data.vy)
      overlay.set('data', new_data)

      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, append)

    _select: (vx, vy, append) ->
      geometry = {
        type: 'poly'
        vx: vx
        vy: vy
      }

      for r in @mget('renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.select(@, @plot_view.renderers[r.id], geometry, true, append)

  class PolySelectTool extends SelectTool.Model
    default_view: PolySelectToolView
    type: "PolySelectTool"
    tool_name: "Poly Select"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAMAAAAVv241AAAAA3NCSVQICAjb4U/gAAAA51BMVEX////+/v79/v78/f38/Pz6+/v6+vr4+Pj29/f29vf19fby8/Tx8fLx8vPx8vLw8fLu7+/q6+zm5+jl5+fk5ufj5OXh4+Ti4+Te3+Dd3+Dd3t/a3N7Z29zY2tvX2dvU1tfT1tfS1dbS1NbP0dPO0NLNz9HKzc/Kzc7JzM7Ex8nDx8nDxsjCxsjAxMa/w8TAw8W9wcO8wMK8wMG4u763u722ur23uryytrmztrmxtbivtLavs7aus7WtsrSusrWtsrWssbOssLOrsLKrr7Kmq66lqq2mqq2kqayjqKujqKqip6qip6uhpqmjmdHyAAAATXRSTlMA/////////////////////////////////////////////////////////////////////////////////////////////////////8TzpBEAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAAAnElEQVQImUWO1xbBQBRF7xBEiDJqiF6iRIneSyQmuP//PUYS7Ke9X846AAAVxjTwGdxG/cMi4vk2KCVAPxLuRZu0pvoYTJWHPYwZAJqiznk829km5MRyfs1jtYRN1O5Cb8JDutN48oSGLH7WCo8quSDuZXebntM75CgBN8kV0TnNqHfCxJclfB+xUg0bvgsZCDMrBD86Dv1Hqg7wBukXEhG+uFsTAAAAAElFTkSuQmCC"
    event_type: "tap"
    default_order: 11

    initialize: (attrs, options) ->
      super(attrs, options)
      @set('overlay', new PolySelection.Model)
      plot_renderers = @get('plot').get('renderers')
      plot_renderers.push(@get('overlay'))
      @get('plot').set('renderers', plot_renderers)

  class PolySelectTools extends Collection
    model: PolySelectTool

  return {
    "Model": PolySelectTool,
    "Collection": new PolySelectTools(),
    "View": PolySelectToolView,
  }
