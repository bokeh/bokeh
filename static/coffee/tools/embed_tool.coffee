tool = require("./tool")
ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator
base = require("../base")

HasParent = base.HasParent

###############################################################
class EmbedToolView extends tool.ToolView
  initialize: (options) ->
    super(options)

  eventGeneratorClass: ButtonEventGenerator
  evgen_options: { buttonText:"Embed Html" }
  tool_events: {
     activated: "_activated"
  }

  _activated: (e) ->
    console.log("EmbedToolView._activated")
    window.tool_view = @
    model_id = @plot_model.get('id')
    doc_id = @plot_model.get('doc')
    doc_apikey = @plot_model.get('docapikey')
    baseurl = @plot_model.get('baseurl')

    script_inject_escaped = @plot_model.get('script_inject_escaped')
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
      $('#embedModal').remove()
      #$('#embedModal .modal').remove()
    )
    $('#embedModal > .modal').modal({show:true});

class EmbedTool extends tool.Tool
   type: "EmbedTool"
   default_view: EmbedToolView

EmbedTool::defaults = _.clone(EmbedTool::defaults)
_.extend(EmbedTool::defaults)


class EmbedTools extends Backbone.Collection
  model: EmbedTool



exports.EmbedToolView = EmbedToolView
exports.embedtools = new EmbedTools


