
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  escapeHTML = (unsafe_str) ->
    unsafe_str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')

  class EmbedToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Embed Html" }
    toolType: "EmbedTool"
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
      modal = """
        <div id="embedModal" class="bokeh">
          <div  class="modal" role="dialog" aria-labelledby="embedLabel" aria-hidden="true">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
              <h3 id="dataConfirmLabel"> HTML Embed code</h3></div><div class="modal-body">
              <div class="modal-body">
                #{script_inject_escaped}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
            </div>
          </div>
        </div>
      """  #FIXME: this quote hack makes my text editor happy"
      $('body').append(modal)
      $('#embedModal > .modal').on('hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool"))
      $('#embedModal > .modal').modal({show:true});
    
    _close_modal : () ->
      $('#embedModal').remove()
      $('#embedModal > .modal').remove()

  class EmbedTool extends Tool.Model
     default_view: EmbedToolView
     type: "EmbedTool"

  class EmbedTools extends Backbone.Collection
    model: EmbedTool

    display_defaults: () ->
      super()

  return {
    "Model": EmbedTool,
    "Collection": new EmbedTools(),
    "View": EmbedToolView,
  }


