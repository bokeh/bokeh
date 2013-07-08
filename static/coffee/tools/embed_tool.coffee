toolview = require("./toolview")
ToolView = toolview.ToolView
ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

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
    window.tool_view = @
    model_id = @plot_model.get('id')
    doc_id = @plot_model.get('doc')
    doc_apikey = @plot_model.get('docapikey')
    baseurl = @plot_model.get('baseurl')
    #note this is unused and will be removed in the next commit 
    js_template = """
 
&lt;script src="http://localhost:5006/bokeh/embed.js" bokeh_plottype="serverconn"
bokeh_docid="#{doc_id}" bokeh_ws_conn_string="ws://localhost:5006/bokeh/sub"
bokeh_docapikey="#{doc_apikey}"

bokeh_root_url="#{baseurl}"
bokeh_root_url="http://localhost:5006"
bokeh_modelid="#{model_id}" bokeh_modeltype="Plot" async="true"&gt;
&lt;/script&gt;

    """ #FIXME: this quote hack makes my text editor happy"
    script_inject_escaped = @plot_model.get('script_inject_escaped')
    modal = """
      <div id="embedModal" class="modal" role="dialog" aria-labelledby="embedLabel" aria-hidden="true">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
          <h3 id="dataConfirmLabel"> HTML Embed code</h3></div><div class="modal-body">
        <div class="modal-body">
          #{script_inject_escaped}
        </div>
        </div><div class="modal-footer">
          <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
        </div>
      </div>
    """  #FIXME: this quote hack makes my text editor happy"
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

