
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class ResetToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Reset View" }
    toolType: "ResetTool"
    tool_events: {
       activated: "_activated"
    }

    _activated: (e) ->
      @plot_view.update_range()
      _.delay((() => @plot_view.eventSink.trigger("clear_active_tool")), 100)

  class ResetTool extends Tool.Model
     default_view: ResetToolView
     type: "ResetTool"

  class ResetTools extends Backbone.Collection
    model: ResetTool

    display_defaults: () ->
      super()

  return {
    "Model": ResetTool,
    "Collection": new ResetTools(),
    "View": ResetToolView,
  }


