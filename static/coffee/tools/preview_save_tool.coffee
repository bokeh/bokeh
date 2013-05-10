toolview = require("./toolview")
ToolView = toolview.ToolView
ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator
LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

class PreviewSaveToolView extends ToolView
  initialize: (options) ->
    super(options)

  eventGeneratorClass: ButtonEventGenerator
  evgen_options: { buttonText:"Preview/Save" }
  tool_events: {
     activated: "_activated"
  }

  _activated: (e) ->
    data_uri = @plot_view.canvas[0].toDataURL()
    modal = """
      '<div id="previewModal" class="modal" role="dialog" aria-labelledby="previewLabel" aria-hidden="true">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
          <h3 id="dataConfirmLabel">Image Preview (right click to save)</h3></div><div class="modal-body">
        <div class="modal-body">
          <img src="#{data_uri}" style="max-height: 300px; max-width: 400px">
        </div>
        </div><div class="modal-footer">
          <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
        </div>
      </div>')
    """
    $('body').append(modal)
    $('#previewModal').on('hidden', () =>
      $('#previewModal').remove()
    )
    $('#previewModal').modal({show:true});

class PreviewSaveTool extends HasParent
  type: "PreviewSaveTool"
  default_view: PreviewSaveToolView

PreviewSaveTool::defaults = _.clone(PreviewSaveTool::defaults)
_.extend(PreviewSaveTool::defaults)


class PreviewSaveTools extends Backbone.Collection
  model: PreviewSaveTool

exports.PreviewSaveToolView = PreviewSaveToolView
exports.previewsavetools = new PreviewSaveTools