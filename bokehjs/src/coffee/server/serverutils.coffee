define [
  "jquery"
  "underscore"
  "common/base"
  "common/socket"
  "common/load_models"
  "common/logging"
  "backbone"
  "common/has_properties"
], ($, _, base, socket, load_models, Logging, Backbone, HasProperties) ->

  logger = Logging.logger

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
  Promises.doc_promises = {}

  # these get set out later
  exports.wswrapper = null
  exports.plotcontext = null
  exports.plotcontextview = null
  exports.Promises = Promises
  copy_on_write_mapping = {}
  utility =
    load_one_object_chain : (docid, objid, is_public) ->
      if is_public
        if not copy_on_write_mapping[docid]
          copy_on_write_mapping[docid] = _.uniqueId('temporary')
        tempdocid = copy_on_write_mapping[docid]
        key = "temporary-#{docid}"
        headers = {}
        headers[key] = tempdocid
        $.ajaxSetup({'headers' : headers})
      HasProperties.prototype.sync = Backbone.sync
      resp = utility.make_websocket()
      resp = resp.then(() ->
        Config = require("common/base").Config
        url = "#{Config.prefix}bokeh/objinfo/#{docid}/#{objid}"
        logger.debug("load one object chain: #{url}")
        resp = $.get(url)
        return resp
      )
      resp.done((data) ->
        all_models = data['all_models']
        load_models(all_models)
        apikey = data['apikey']
        submodels(exports.wswrapper, "bokehplot:#{docid}", apikey)
        if is_public
          submodels(exports.wswrapper, "bokehplot:#{tempdocid}", null)
      )
      return resp

    load_user: () ->
      response = $.get('/bokeh/userinfo/', {})
      return response

    load_doc_by_title: (title) ->
      Config = require("common/base").Config

      response = $.get(Config.prefix + "bokeh/doc", {title : title})
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
      resp = utility.make_websocket()
      resp = resp.then(() ->
        Config = require("common/base").Config
        return $.get(Config.prefix + "bokeh/bokehinfo/#{docid}/", {})
      )
      resp.done((data) ->
        all_models = data['all_models']
        load_models(all_models)
        apikey = data['apikey']
        submodels(exports.wswrapper, "bokehplot:#{docid}", apikey)
      )
      return resp

    make_websocket: () ->
      if exports.wswrapper?
        return exports._wswrapper_deferred
      else
        Config = require("common/base").Config
        exports._wswrapper_deferred = $.get(Config.prefix + "bokeh/wsurl/")
        resp = exports._wswrapper_deferred
        resp.done((data) ->
          Config = require("common/base").Config
          configure_server(data, null)
          wswrapper = new WebSocketWrapper(Config.ws_conn_string)
          exports.wswrapper = wswrapper
        )
        return resp


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
          logger.debug("instantiate_doc_single #{docid}")
          data = JSON.parse(data)
          load_models(data['all_models'])
          Deferreds._doc_loaded.resolve(data)
        )
  # Hugo: Todo, lift utility functions outside of utility object
  # and into this module

  configure_server = (ws_conn_string, prefix) ->
    ## This function can be called multiple times
    ## if you only want to set ws_conn_string, pass null for prefix
    ## if you only want to set prefix, pass null for ws_conn_string

    Config = require("common/base").Config
    if ws_conn_string
      Config.ws_conn_string = ws_conn_string
      logger.debug("setting ws_conn_string to: #{Config.ws_conn_string}")
    if prefix
      Config.prefix = prefix
      logger.debug("setting prefix to #{Config.prefix}")
    return null

  exports.utility = utility
  exports.configure_server = configure_server

  return exports
