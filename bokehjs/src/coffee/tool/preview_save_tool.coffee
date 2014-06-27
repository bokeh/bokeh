
define [
  "underscore",
  "jquery",
  "bootstrap/modal",
  "backbone",
  "common/bulk_save",
  "./tool",
  "./event_generators",
  "./preview_save_tool_template",
], (_, $, $$1, Backbone, bulk_save, Tool, EventGenerators, preview_save_tool_template) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class PreviewSaveToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText: "Preview/Save" }
    toolType: "PreviewSaveTool"
    tool_events: {
      activated: "_activated"
      deactivated: "_close_modal"
    }

    _activated: (e) ->
      data_uri = @plot_view.canvas_view.canvas[0].toDataURL()
      @plot_model.set('png', @plot_view.canvas_view.canvas[0].toDataURL())

      @$modal = $(preview_save_tool_template({data_uri: data_uri}))
      $('body').append(@$modal)

      @$modal.on('hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool"))
      @$modal.modal({show: true})

    _close_modal : () ->
      @$modal.remove()

  class PreviewSaveTool extends Tool.Model
    default_view: PreviewSaveToolView
    type: "PreviewSaveTool"

    display_defaults: () ->
      super()

  class PreviewSaveTools extends Backbone.Collection
    model: PreviewSaveTool

  return {
    Model: PreviewSaveTool,
    Collection: new PreviewSaveTools(),
    View: PreviewSaveToolView,
  }
