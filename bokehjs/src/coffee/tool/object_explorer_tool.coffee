define [
  "underscore",
  "jquery",
  "modal",
  "backbone",
  "./tool",
  "./event_generators",
  "util/object_explorer",
], (_, $, $$1, Backbone, Tool, EventGenerators, ObjectExplorer) ->

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
      modal = $("""
      <div id='objectExplorerModal' class='bokeh'>
        <div class="modal" role="dialog" aria-labelledby="objectExplorerLabel" aria-hidden="true">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
            <h3 id="dataConfirmLabel">Object Explorer</h3>
          </div>
          <div class="modal-body">
          </div>
          <div class="modal-footer">
            <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
          </div>
        </div>
      </div>
      """)
      @$object_explorer_view = new ObjectExplorer.View({
        el: modal.find(".modal-body")
      })
      $('body').append(modal)
      $('#objectExplorerModal .modal').on 'hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool")
      $('#objectExplorerModal > .modal').modal({show: true})

    _close_modal : () ->
        $('#objectExplorerModal').remove()
        $('#objectExplorerModal > .modal').remove()

  class ObjectExplorerTool extends Tool.Model
    default_view: ObjectExplorerToolView
    type: "ObjectExplorerTool"

    display_defaults: () ->
      super()

  class ObjectExplorerTools extends Backbone.Collection
    model: ObjectExplorerTool

  return {
    "Model": ObjectExplorerTool,
    "Collection": new ObjectExplorerTools(),
    "View": ObjectExplorerToolView,
  }
