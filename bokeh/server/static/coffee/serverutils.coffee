#not proud of this refactor... but we can make it better later
Deferreds = {}
Promises = {}
Deferreds._doc_loaded = $.Deferred()
Deferreds._doc_requested = $.Deferred()
Promises.doc_loaded = Deferreds._doc_loaded.promise()
Promises.doc_requested = Deferreds._doc_requested.promise()
Promises.doc_promises = {};

base = require("./base")
Collections = base.Collections
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
HasProperties.prototype.sync = Backbone.sync


utility =
  load_user : () ->
    response = $.get('/bokeh/userinfo/', {})
    return response


  load_doc_once : (docid) ->
    if _.has(Promises.doc_promises, docid)
      console.log("already found #{docid} in promises")
      return Promises.doc_promises[docid]
    else
      console.log("#{docid} not in promises, loading it")
      doc_prom = utility.load_doc(docid)
      Promises.doc_promises[docid] = doc_prom
      return doc_prom

  load_doc_by_title : (title) ->
    response = $.get(Config.prefix + "/bokeh/doc", {title : title})
      .done((data) ->
        all_models = data['all_models']
        load_models(all_models)
        apikey = data['apikey']
        docid = data['docid']
        submodels(exports.wswrapper, "bokehplot:#{docid}", apikey)
      )
    return response

  load_doc_static : (docid, data) ->
    """ loads data without making a websocket connection """
    load_data(data['all_models'])
    promise = jQuery.Deferred()
    promise.resolve()
    return promise


  load_doc : (docid) ->
    wswrapper = utility.make_websocket();
    response = $.get(Config.prefix + "/bokeh/bokehinfo/#{docid}/", {})
      .done((data) ->
        all_models = data['all_models']
        load_models(all_models)
        apikey = data['apikey']
        submodels(exports.wswrapper, "bokehplot:#{docid}", apikey)
      )
    return response

  make_websocket : () ->
    wswrapper = new WebSocketWrapper(Config.ws_conn_string)
    exports.wswrapper = wswrapper
    return wswrapper

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
    if  Promises.doc_requested.state() == "pending"
      Deferreds._doc_requested.resolve()
      $.get("#{protocol}://#{host}/bokeh/publicbokehinfo/#{docid}", {}, (data) ->
        console.log('instatiate_doc_single, docid', docid)
        data = JSON.parse(data)
        load_models(data['all_models'])
        Deferreds._doc_loaded.resolve(data)
      )
  instantiate_doc_single_plot : (docid, view_model_id, target_el="#PlotPane", host="www.wakari.io") ->
    #this should not use plot contexts!
    # TODO: The container got "refactored" away when Bryan moved things around
    # in BokehJS, and the SinglePlotContextView no longer exists. Either remove
    # this code or update it.
    container = require("./container")
    utility.bokeh_connection(host, docid, "https")
    Deferreds._doc_loaded.done((data) ->
      utility.render_plots(data.plot_context_ref,
        #container.SinglePlotContextView,
        container.PlotContextView,
        {target_model_id : view_model_id}
      )
      $(target_el).empty().append(exports.plotcontextview.el)
    )

exports.utility = utility
