
class ActiveToolManager
  """ This makes sure that only one tool is active at a time """

  constructor : (@event_sink) ->
    @event_sink.active = null

  bind_bokeh_events : () ->
    @event_sink.on("clear_active_tool", () =>
      @event_sink.trigger("#{@event_sink.active}:deactivated")
      @event_sink.active = null
    )

    @event_sink.on("active_tool", (toolName) =>
      console.log("ActiveToolManager active_tool", toolName)
      if toolName != @event_sink.active
        @event_sink.trigger("#{toolName}:activated")
        @event_sink.trigger("#{@event_sink.active}:deactivated")
        @event_sink.active = toolName
    )

    @event_sink.on("try_active_tool", (toolName) =>
      if not @event_sink.active?
        @event_sink.trigger("#{toolName}:activated")
        @event_sink.trigger("#{@event_sink.active}:deactivated")
        @event_sink.active = toolName
    )

exports.ActiveToolManager = ActiveToolManager