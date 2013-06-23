tool= require("./tool")
ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator
LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper

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

class PreviewSaveTool extends tool.Tool
  type: "PreviewSaveTool"
  default_view: PreviewSaveToolView

PreviewSaveTool::defaults = _.clone(PreviewSaveTool::defaults)
_.extend(PreviewSaveTool::defaults)


class PreviewSaveTools extends Backbone.Collection
  model: PreviewSaveTool

###############################################################
class EmbedToolView extends ToolView
  initialize: (options) ->
    super(options)

  eventGeneratorClass: ButtonEventGenerator
  evgen_options: { buttonText:"Embed Html" }
  tool_events: {
     activated: "_activated"
  }

  _activated: (e) ->
    console.log("EmbedToolView._activated")
    modal = """
      '<div id="embedModal" class="modal" role="dialog" aria-labelledby="embedLabel" aria-hidden="true">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
          <h3 id="dataConfirmLabel"> HTML Embed code</h3></div><div class="modal-body">
        <div class="modal-body">

&lt;script src="http://localhost:5006/bokeh/embed.js" bokeh_plottype="serverconn"
bokeh_docid="f66ebc17-dd93-4497-853d-d57063372bce" bokeh_ws_conn_string="ws://localhost:5006/bokeh/sub"
bokeh_docapikey="0d1efb97-c52c-4054-bbf0-9c8c22a0eccb" bokeh_root_url="http://localhost:5006"
bokeh_modelid="b9c1d5dc-c617-41bc-9df7-bed21020035e" bokeh_modeltype="Plot" async="true"&gt;
&lt;/script&gt;

        </div>
        </div><div class="modal-footer">
          <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
        </div>
      </div>')
    """
    $('body').append(modal)
    $('#embedModal').on('hidden', () =>
      $('#embedModal').remove()
    )
    $('#embedModal').modal({show:true});

 class EmbedTool extends HasParent
   type: "EmbedTool"
   default_view: EmbedToolView

 EmbedTool::defaults = _.clone(EmbedTool::defaults)
 _.extend(EmbedTool::defaults)


 class EmbedTools extends Backbone.Collection
   model: EmbedTool


exports.EmbedToolView = EmbedToolView
exports.embedtools = new EmbedTools

