
define [
  "underscore",
  "common/plot_widget",
  "common/has_parent",
], (_, PlotWidget, HasParent) ->

  class ToolView extends PlotWidget
    initialize: (options) ->
      super(options)

    bind_bokeh_events: () ->
      eventSink = @plot_view.eventSink
      evgen_options = {
        eventBasename:@cid,
        buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAADfSURBVEiJ1ZXhDYIwEEbfZxzADWQDR5ANXMFRHMERdBLZQDdQN9AJPv+gIajQClZ8SUNy6d0j5a7INikZJbUNVijpaQFLYAesa/FGxh1etgBOwCUqy3brKvflto9up7lWiND2KkAUJAxtmgK4Rh3dGxQyh5KwPQE2wKRle96LsI7tDJgCV0mHSry5WGjTvMi7f9cipl6Xwc/K5zwmqQ9hFMO82oYifIyH7TyFcPZJ0l8d6U+F+VeFMU3Si7DCOalQUgZskwlt74EFEddcl9/TsiJaS7qU8e7CPvnbOQzmBk+aLHum0l/aAAAAAElFTkSuQmCC"
      }
      evgen_options2 = _.extend(evgen_options, @evgen_options)
      evgen = new @eventGeneratorClass(evgen_options2)
      evgen.bind_bokeh_events(@plot_view, eventSink)

      _.each(@tool_events, (handler_f, event_name) =>
        full_event_name = "#{@cid}:#{event_name}"
        wrap = (e) =>
          @[handler_f](e)
        eventSink.on(full_event_name, wrap))
      @evgen = evgen

    view_coords: (sx, sy) ->
      [vx, vy] = [
        @plot_view.canvas.sx_to_vx(sx),
        @plot_view.canvas.sy_to_vy(sy)
      ]
      return [vx, vy]

  class Tool extends HasParent

    display_defaults: ->
      return _.extend {}, super(), {
        level: 'tool'
      }

  return {
    "Model": Tool,
    "View": ToolView
  }
