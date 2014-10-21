(function() {
  define(["common/base", "common/socket", "common/load_models", "common/logging", "backbone", "common/has_properties"], function(base, socket, load_models, Logging, Backbone, HasProperties) {
    var Deferreds, Promises, WebSocketWrapper, configure_server, exports, logger, submodels, utility;
    logger = Logging.logger;
    Deferreds = {};
    Promises = {};
    exports = {};
    WebSocketWrapper = socket.WebSocketWrapper;
    submodels = socket.submodels;
    Deferreds._doc_loaded = $.Deferred();
    Deferreds._doc_requested = $.Deferred();
    Promises.doc_loaded = Deferreds._doc_loaded.promise();
    Promises.doc_requested = Deferreds._doc_requested.promise();
    Promises.doc_promises = {};
    exports.wswrapper = null;
    exports.plotcontext = null;
    exports.plotcontextview = null;
    exports.Promises = Promises;
    utility = {
      load_one_object_chain: function(docid, objid) {
        var resp;
        HasProperties.prototype.sync = Backbone.sync;
        resp = utility.make_websocket();
        resp = resp.then(function() {
          var Config, url;
          Config = require("common/base").Config;
          url = "" + Config.prefix + "bokeh/objinfo/" + docid + "/" + objid;
          logger.debug("load one object chain: " + url);
          resp = $.get(url);
          return resp;
        });
        resp.done(function(data) {
          var all_models, apikey;
          all_models = data['all_models'];
          load_models(all_models);
          apikey = data['apikey'];
          return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
        });
        return resp;
      },
      load_user: function() {
        var response;
        response = $.get('/bokeh/userinfo/', {});
        return response;
      },
      load_doc_by_title: function(title) {
        var Config, response;
        Config = require("common/base").Config;
        response = $.get(Config.prefix + "bokeh/doc", {
          title: title
        }).done(function(data) {
          var all_models, apikey, docid;
          all_models = data['all_models'];
          load_models(all_models);
          apikey = data['apikey'];
          docid = data['docid'];
          return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
        });
        return response;
      },
      load_doc_static: function(docid, data) {
        " loads data without making a websocket connection ";
        var promise;
        load_data(data['all_models']);
        promise = jQuery.Deferred();
        promise.resolve();
        return promise;
      },
      load_doc: function(docid) {
        var resp;
        resp = utility.make_websocket();
        resp = resp.then(function() {
          var Config;
          Config = require("common/base").Config;
          return $.get(Config.prefix + ("bokeh/bokehinfo/" + docid + "/"), {});
        });
        resp.done(function(data) {
          var all_models, apikey;
          all_models = data['all_models'];
          load_models(all_models);
          apikey = data['apikey'];
          return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
        });
        return resp;
      },
      make_websocket: function() {
        var Config, resp;
        if (exports.wswrapper != null) {
          return exports._wswrapper_deferred;
        } else {
          Config = require("common/base").Config;
          exports._wswrapper_deferred = $.get(Config.prefix + "bokeh/wsurl/");
          resp = exports._wswrapper_deferred;
          resp.done(function(data) {
            var wswrapper;
            Config = require("common/base").Config;
            configure_server(data, null);
            wswrapper = new WebSocketWrapper(Config.ws_conn_string);
            return exports.wswrapper = wswrapper;
          });
          return resp;
        }
      },
      render_plots: function(plot_context_ref, viewclass, viewoptions) {
        var Collections, options, plotcontext, plotcontextview;
        if (viewclass == null) {
          viewclass = null;
        }
        if (viewoptions == null) {
          viewoptions = {};
        }
        Collections = require("common/base").Collections;
        plotcontext = Collections(plot_context_ref.type).get(plot_context_ref.id);
        if (!viewclass) {
          viewclass = plotcontext.default_view;
        }
        options = _.extend(viewoptions, {
          model: plotcontext
        });
        plotcontextview = new viewclass(options);
        plotcontext = plotcontext;
        plotcontextview = plotcontextview;
        plotcontextview.render();
        exports.plotcontext = plotcontext;
        return exports.plotcontextview = plotcontextview;
      },
      bokeh_connection: function(host, docid, protocol) {
        if (_.isUndefined(protocol)) {
          protocol = "https";
        }
        if (Promises.doc_requested.state() === "pending") {
          Deferreds._doc_requested.resolve();
          return $.get("" + protocol + "://" + host + "/bokeh/publicbokehinfo/" + docid, {}, function(data) {
            logger.debug("instantiate_doc_single " + docid);
            data = JSON.parse(data);
            load_models(data['all_models']);
            return Deferreds._doc_loaded.resolve(data);
          });
        }
      }
    };
    configure_server = function(ws_conn_string, prefix) {
      var Config;
      Config = require("common/base").Config;
      if (ws_conn_string) {
        Config.ws_conn_string = ws_conn_string;
        logger.debug("setting ws_conn_string to: " + Config.ws_conn_string);
      }
      if (prefix) {
        Config.prefix = prefix;
        logger.debug("setting prefix to " + Config.prefix);
      }
      return null;
    };
    exports.utility = utility;
    exports.configure_server = configure_server;
    return exports;
  });

}).call(this);

/*
//@ sourceMappingURL=serverutils.js.map
*/