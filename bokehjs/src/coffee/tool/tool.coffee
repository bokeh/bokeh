
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
      evgen_options = { eventBasename:@cid }
      evgen_options2 = _.extend(evgen_options, @evgen_options)
      evgen = new @eventGeneratorClass(evgen_options2)
      evgen.bind_bokeh_events(@plot_view, eventSink)

      _.each(@tool_events, (handler_f, event_name) =>
        full_event_name = "#{@cid}:#{event_name}"
        wrap = (e) =>
          @[handler_f](e)
        eventSink.on(full_event_name, wrap))
      @evgen = evgen
      render: () ->

  class Tool extends HasParent

    display_defaults: () ->
      return {
        level: 'tool'
      }

  return {
    "Model": Tool,
    "View": ToolView
  }