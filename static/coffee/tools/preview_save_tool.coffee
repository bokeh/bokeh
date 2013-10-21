tool= require("./tool")
ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator
base = require("../base")

class PreviewSaveToolView extends tool.ToolView
  initialize: (options) ->
    super(options)

  eventGeneratorClass: ButtonEventGenerator
  evgen_options: { buttonText:"Preview/Save" }
  tool_events: {
     activated: "_activated"
  }

  _activated: (e) ->
    data_uri = @plot_view.canvas[0].toDataURL()
    @plot_model.set('png', @plot_view.canvas[0].toDataURL())
    base.Collections.bulksave([@plot_model])
    #@model.sync()
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
      $('#previewModal').remove()
      $('#previewModal > .modal').remove()
    )
    $('#previewModal > .modal').modal({show:true});

class PreviewSaveTool extends tool.Tool
  type: "PreviewSaveTool"
  default_view: PreviewSaveToolView

PreviewSaveTool::defaults = _.clone(PreviewSaveTool::defaults)
_.extend(PreviewSaveTool::defaults)


class PreviewSaveTools extends Backbone.Collection
  model: PreviewSaveTool

exports.PreviewSaveToolView = PreviewSaveToolView
exports.previewsavetools = new PreviewSaveTools

