
define [
  "underscore",
  "jquery",
  "backbone",
  "common/bulk_save",
  "./tool",
  "./event_generators",
  "bootstrap",
], (_, $, Backbone, bulk_save, Tool, EventGenerators) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class ColumnSelectToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"ColumnSelect" }
    toolType: "ColumnSelectTool"
    tool_events: {
       activated: "_activated"
       deactivated: "_close_modal"
    }

    _activated: (e) ->
      data_uri = @plot_view.canvas[0].toDataURL()
      @plot_model.set('png', @plot_view.canvas[0].toDataURL())
      modal = """
      <div id='previewModal' class='bokeh'>
        <div class="modal" role="dialog" aria-labelledby="previewLabel" aria-hidden="true">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3 id="dataConfirmLabel">Image Preview (right click to save)</h3></div><div class="modal-body">
          <div class="modal-body">
            <img src="#{data_uri}" style="max-height: 300px; max-width: 400px">
          </div>
          </div><div class="modal-footer">
            <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
          </div>
        </div>
      </div>
      """ # hack to keep my text editor happy "
      $('body').append(modal)
      $('#previewModal .modal').on('hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool"))
      $('#previewModal > .modal').modal({show:true});

    _close_modal : () ->
        $('#previewModal').remove()
        $('#previewModal > .modal').remove()

  class ColumnSelectTool extends Tool.Model
    default_view: ColumnSelectToolView
    type: "ColumnSelectTool"

    display_defaults: () ->
      super()

  class ColumnSelectTools extends Backbone.Collection
    model: ColumnSelectTool

  return {
    "Model": ColumnSelectTool,
    "Collection": new ColumnSelectTools(),
    "View": ColumnSelectToolView
  }
