
define [
  "underscore",
  "jquery",
  "bootstrap/modal",
  "backbone",
  "./tool",
  "./event_generators",
  "./embed_tool_template",
], (_, $, $$1, Backbone, Tool, EventGenerators, embed_tool_template) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  escapeHTML = (unsafe_str) ->
    unsafe_str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')

  class AutoRangeToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Auto Range" }
    toolType: "AutoRangeTool"
    tool_events: {
       activated: "_activated"
       deactivated: "_close_modal"
    }

    _activated: (e) ->
      console.log("EmbedToolView._activated")
      window.tool_view = @
      model_id = @plot_model.get('id')
      doc_id = @plot_model.get('doc')
      doc_apikey = @plot_model.get('docapikey')
      baseurl = @plot_model.get('baseurl')

      script_inject_escaped = escapeHTML(@plot_model.get('script_inject_snippet'))

      @$modal = $(embed_tool_template({script_inject_escaped: script_inject_escaped}))
      $('body').append(@$modal)
      @$modal.on 'hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool")
      @$modal.modal({show: true})

    _close_modal : () ->
      @$modal.remove()

  class AutoRangeTool extends Tool.Model
     default_view: AutoRangeToolView
     type: "AutoRangeTool"

  class AutoRangeTools extends Backbone.Collection
    model: AutoRangeTool

    display_defaults: () ->
      super()

  return {
    Model: AutoRangeTool,
    Collection: new AutoRangeTools(),
    View: AutoRangeToolView,
  }


