#not proud of this refactor... but we can make it better later
Deferreds = {}
Promises = {}
Deferreds._doc_loaded = $.Deferred()
Deferreds._doc_requested = $.Deferred()
Promises.doc_loaded = Deferreds._doc_loaded.promise()
base = require("./bokehjs/base")
Collections = base.Collections
container = require("./bokehjs/container")
HasProperties = base.HasProperties
load_models = base.load_models
submodels = base.submodels
WebSocketWrapper = base.WebSocketWrapper
Config = base.Config

# these get set out later
exports.wswrapper = null
exports.plotcontext = null
exports.plotcontextview = null
exports.Promises = Promises

utility =
  load_default_document : (viewclass=null, viewoptions={}) ->
    user = $.get('/bokeh/userinfo/', {}, (data) ->
      console.log(data)
      docs = JSON.parse(data)['docs']
      console.log(docs)
      utility.instantiate_doc(docs[0])
    )
  instantiate_doc : (docid, viewclass=null, viewoptions={}) ->
    $.get("/bokeh/bokehinfo/#{docid}", {}, (data) ->
      data = JSON.parse(data)
      Config.plot_context_ref = data['plot_context_ref']
      docid = data['docid'] # in case the server returns a different docid
      Config.docid = docid
      $('.resetlink').click(()->
        $.get("/bokeh/bb/#{docid}/reset")
      )
      all_models = data['all_models']
      load_models(all_models)
      HasProperties.prototype.sync = Backbone.sync
      apikey = data['apikey']
      Config.apikey = apikey
      #up to the user to stuff the ws_conn_string into base.Config
      wswrapper = new WebSocketWrapper(Config.ws_conn_string)
      exports.wswrapper = wswrapper
      submodels(wswrapper, "bokehplot:#{docid}", apikey)
      utility.render_plots(data.plot_context_ref, viewclass, viewoptions)
      Deferreds._doc_loaded.resolve(docid)
    )
  render_plots : (plot_context_ref, viewclass=null, viewoptions={}) ->
    plotcontext = Collections(plot_context_ref.type).get(plot_context_ref.id)
    if not viewclass
      viewclass = plotcontext.default_view
    options = _.extend(viewoptions, {model : plotcontext})
    plotcontextview = new viewclass(options)
    plotcontext = plotcontext
    plotcontextview = plotcontextview
    plotcontextview.render()

    exports.plotcontext = plotcontext
    exports.plotcontextview = plotcontextview

  bokeh_connection : (host, docid, protocol) ->
    if _.isUndefined(protocol)
      protocol="https"
    if not Deferreds._doc_requested.isResolved()
      Deferreds._doc_requested.resolve()
      $.get("#{protocol}://#{host}/bokeh/publicbokehinfo/#{docid}", {}, (data) ->
        console.log('instatiate_doc_single, docid', docid)
        data = JSON.parse(data)
        load_models(data['all_models'])
        Deferreds._doc_loaded.resolve(data)
      )
  instantiate_doc_single_plot : (docid, view_model_id, target_el="#PlotPane", host="www.wakari.io") ->
    #this should not use plot contexts!
    utility.bokeh_connection(host, docid)
    Deferreds._doc_loaded.done((data) ->
      utility.render_plots(data.plot_context_ref,
        {target_model_id : view_model_id}
      )
      $(target_el).empty().append(exports.plotcontextview.el)
    )

exports.utility = utility
