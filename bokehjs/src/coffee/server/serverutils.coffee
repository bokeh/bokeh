define [
  "common/base",
  "server/serverutils",
  "common/socket",
  "common/load_models"
], (base, serverutils, socket, load_models) ->

  #not proud of this refactor... but we can make it better later
  Deferreds = {}
  Promises = {}
  exports = {}
  WebSocketWrapper = socket.WebSocketWrapper
  submodels = socket.submodels
  Deferreds._doc_loaded = $.Deferred()
  Deferreds._doc_requested = $.Deferred()
  Promises.doc_loaded = Deferreds._doc_loaded.promise()
  Promises.doc_requested = Deferreds._doc_requested.promise()
  Promises.doc_promises = {};

  # these get set out later
  exports.wswrapper = null
  exports.plotcontext = null
  exports.plotcontextview = null
  exports.Promises = Promises

  utility =
    load_user: () ->
      response = $.get('/bokeh/userinfo/', {})
      return response

    load_doc_once: (docid) ->
      if _.has(Promises.doc_promises, docid)
        console.log("already found #{docid} in promises")
        return Promises.doc_promises[docid]
      else
        console.log("#{docid} not in promises, loading it")
        doc_prom = utility.load_doc(docid)
        Promises.doc_promises[docid] = doc_prom
        return doc_prom

    load_doc_by_title: (title) ->
      Config = require("common/base").Config

      response = $.get(Config.prefix + "/bokeh/doc", {title : title})
        .done((data) ->
          all_models = data['all_models']
          load_models(all_models)
          apikey = data['apikey']
          docid = data['docid']
          submodels(exports.wswrapper, "bokehplot:#{docid}", apikey)
        )
      return response

    load_doc_static: (docid, data) ->
      """ loads data without making a websocket connection """
      load_data(data['all_models'])
      promise = jQuery.Deferred()
      promise.resolve()
      return promise

    load_doc: (docid) ->
      wswrapper = utility.make_websocket();
      Config = require("common/base").Config
      response = $.get(Config.prefix + "/bokeh/bokehinfo/#{docid}/", {})
        .done((data) ->
          all_models = data['all_models']
          load_models(all_models)
          apikey = data['apikey']
          submodels(exports.wswrapper, "bokehplot:#{docid}", apikey)
        )
      return response

    make_websocket: () ->
      Config = require("common/base").Config
      wswrapper = new WebSocketWrapper(Config.ws_conn_string)
      exports.wswrapper = wswrapper
      return wswrapper

    render_plots: (plot_context_ref, viewclass=null, viewoptions={}) ->
      Collections = require("common/base").Collections
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

    bokeh_connection: (host, docid, protocol) ->
      if _.isUndefined(protocol)
        protocol = "https"
      if Promises.doc_requested.state() == "pending"
        Deferreds._doc_requested.resolve()
        $.get("#{protocol}://#{host}/bokeh/publicbokehinfo/#{docid}", {}, (data) ->
          console.log('instatiate_doc_single, docid', docid)
          data = JSON.parse(data)
          load_models(data['all_models'])
          Deferreds._doc_loaded.resolve(data)
        )

  exports.utility = utility

  return exports
