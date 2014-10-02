
define [
  "underscore",
  "common/collection",
  "tool/select_tool",
], (_, Collection, SelectTool) ->

  class TapToolView extends SelectTool.View

    _keyup: (e) ->
      if e.keyCode == 27
        for r in @mget('renderers')
          ds = r.get('data_source')
          sm = ds.get('selection_manager')
          sm.clear()

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
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAADfSURBVEiJ1ZXhDYIwEEbfZxzADWQDR5ANXMFRHMERdBLZQDdQN9AJPv+gIajQClZ8SUNy6d0j5a7INikZJbUNVijpaQFLYAesa/FGxh1etgBOwCUqy3brKvflto9up7lWiND2KkAUJAxtmgK4Rh3dGxQyh5KwPQE2wKRle96LsI7tDJgCV0mHSry5WGjTvMi7f9cipl6Xwc/K5zwmqQ9hFMO82oYifIyH7TyFcPZJ0l8d6U+F+VeFMU3Si7DCOalQUgZskwlt74EFEddcl9/TsiJaS7qU8e7CPvnbOQzmBk+aLHum0l/aAAAAAElFTkSuQmCC"
    event_type: "tap"

  class TapTools extends Collection
    model: TapTool

  return {
    "Model": TapTool,
    "Collection": new TapTools(),
    "View": TapToolView,
  }
