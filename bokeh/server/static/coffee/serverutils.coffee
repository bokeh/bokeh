#not proud of this refactor... but we can make it better later
Deferreds = {}
Promises = {}
Deferreds._doc_loaded = $.Deferred()
Deferreds._doc_requested = $.Deferred()
Promises.doc_loaded = Deferreds._doc_loaded.promise()
Promises.doc_requested = Deferreds._doc_requested.promise()
base = require("./base")
Collections = base.Collections
container = require("./container")
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

  load_doc : (docid) ->
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
    utility.bokeh_connection(host, docid, "https")
    Deferreds._doc_loaded.done((data) ->
      utility.render_plots(data.plot_context_ref,
        container.SinglePlotContextView,
        {target_model_id : view_model_id}
      )
      $(target_el).empty().append(exports.plotcontextview.el)
    )

exports.utility = utility
