PlotWidget = require('../common/plot_widget').PlotWidget

class ToolView extends PlotWidget
  initialize : (options) ->
    super(options)
  bind_events : (plotview) ->
    eventSink = plotview.eventSink
    @plotview = plotview
    evgen_options = { eventBasename:@cid }
    evgen_options2 = _.extend(evgen_options, @evgen_options)
    evgen = new @eventGeneratorClass(evgen_options2)
    evgen.bind_events(plotview, eventSink)

    _.each(@tool_events, (handler_f, event_name) =>
      full_event_name = "#{@cid}:#{event_name}"
      wrap = (e) =>
        @[handler_f](e)
      eventSink.on(full_event_name, wrap))

exports.ToolView = ToolView