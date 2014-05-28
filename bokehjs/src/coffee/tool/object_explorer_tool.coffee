define [
  "underscore",
  "jquery",
  "bootstrap/modal",
  "backbone",
  "./tool",
  "./event_generators",
  "./object_explorer_tool_template",
  "widget/object_explorer",
], (_, $, $$1, Backbone, Tool, EventGenerators, object_explorer_tool_template, ObjectExplorer) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class ObjectExplorerToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText: "Object Explorer" }
    toolType: "ObjectExplorerTool"
    tool_events: {
       activated: "_activated"
       deactivated: "_close_modal"
    }

    _activated: (e) ->
      @$modal = $(object_explorer_tool_template({}))
      @$object_explorer_view = new ObjectExplorer.View({
        el: @$modal.find(".bk-bs-modal-body")
      })
      $('body').append(@$modal)
      @$modal.on 'hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool")
      @$modal.modal({show: true})

    _close_modal : () ->
      @$modal.remove()

  class ObjectExplorerTool extends Tool.Model
    default_view: ObjectExplorerToolView
    type: "ObjectExplorerTool"

    display_defaults: () ->
      super()

  class ObjectExplorerTools extends Backbone.Collection
    model: ObjectExplorerTool

  return {
    Model: ObjectExplorerTool,
    Collection: new ObjectExplorerTools(),
    View: ObjectExplorerToolView,
  }
