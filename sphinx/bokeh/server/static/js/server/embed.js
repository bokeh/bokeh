(function() {
  define(["jquery", "./serverutils", "./usercontext/usercontext", "common/base", "common/has_properties", "common/load_models", "common/logging"], function($, serverutils, usercontext, base, HasProperties, load_models, Logging) {
    var add_plot_server, add_plot_static, index, inject_css, inject_plot, logger, reload, server_page, _render, _render_all, _render_one;
    index = base.index;
    logger = Logging.logger;
    reload = function() {
      var Config, ping_url;
      Config = require("common/base").Config;
      ping_url = "" + Config.prefix + "bokeh/ping";
      $.get(ping_url).success(function() {
        logger.info('reloading');
        return window.location.reload();
      }).fail(_.delay((function() {
        return reload();
      }), 1000));
      return null;
    };
    inject_css = function(url) {
      var link;
      link = $("<link href='" + url + "' rel='stylesheet' type='text/css'>");
      return $('body').append(link);
    };
    add_plot_static = function(element, model_id, model_type, all_models) {
      var model, view;
      if (!(model_id in index)) {
        load_models(all_models);
        index[model_id] = view;
      }
      model = base.Collections(model_type).get(model_id);
      view = new model.default_view({
        model: model
      });
      return _.delay(function() {
        return $(element).replaceWith(view.$el);
      });
    };
    add_plot_server = function(element, doc_id, model_id) {
      var resp;
      resp = serverutils.utility.load_one_object_chain(doc_id, model_id);
      return resp.done(function(data) {
        var model, view, wswrapper;
        model = base.Collections(data.type).get(model_id);
        view = new model.default_view({
          model: model
        });
        _.delay(function() {
          return $(element).replaceWith(view.$el);
        });
        if (!(model_id in index)) {
          index[model_id] = view;
        }
        wswrapper = serverutils.wswrapper;
        wswrapper.subscribe("debug:debug", "");
        return wswrapper.on('msg:debug:debug', function(msg) {
          if (msg === 'reload') {
            return reload();
          }
        });
      });
    };
    inject_plot = function(element_id, all_models) {
      var container, info, script;
      script = $("#" + element_id);
      if (script.length === 0) {
        throw "Error injecting plot: could not find script tag with id: " + element_id;
      }
      if (script.length > 1) {
        throw "Error injecting plot: found too many script tags with id: " + element_id;
      }
      if (!document.body.contains(script[0])) {
        throw "Error injecting plot: autoload script tag may only be under <body>";
      }
      info = script.data();
      Bokeh.set_log_level(info['bokehLoglevel']);
      logger.info("Injecting plot for script tag with id: #" + element_id);
      base.Config.prefix = info['bokehRootUrl'];
      container = $('<div>', {
        "class": 'bokeh-container'
      });
      container.insertBefore(script);
      if (info.bokehData === "static") {
        logger.info("  - using static data");
        return add_plot_static(container, info["bokehModelid"], info["bokehModeltype"], all_models);
      } else if (info.bokehData === "server") {
        logger.info("  - using server data");
        return add_plot_server(container, info["bokehDocid"], info["bokehModelid"]);
      } else {
        throw "Unknown bokehData value for inject_plot: " + info.bokehData;
      }
    };
    server_page = function(title) {
      HasProperties.prototype.sync = Backbone.sync;
      return $(function() {
        var resp;
        resp = serverutils.utility.make_websocket();
        return resp.then(function() {
          var load, userdocs, wswrapper;
          wswrapper = serverutils.wswrapper;
          userdocs = new usercontext.UserDocs();
          userdocs.subscribe(wswrapper, 'defaultuser');
          load = userdocs.fetch();
          load.done(function() {
            if (title != null) {
              return _render_one(userdocs, title);
            } else {
              return _render_all(userdocs);
            }
          });
          logger.info('subscribing to debug');
          wswrapper.subscribe("debug:debug", "");
          return wswrapper.on('msg:debug:debug', function(msg) {
            if (msg === 'reload') {
              return reload();
            }
          });
        });
      });
    };
    _render_all = function(userdocs) {
      var userdocsview;
      userdocsview = new usercontext.UserDocsView({
        collection: userdocs
      });
      return _render(userdocsview.el);
    };
    _render_one = function(userdocs, title) {
      var doc, msg;
      doc = userdocs.find(function(doc) {
        return doc.get('title') === title;
      });
      if (doc != null) {
        doc.on('loaded', function() {
          var plot_context, plot_context_view;
          plot_context = doc.get('plot_context');
          plot_context_view = new plot_context.default_view({
            model: plot_context
          });
          return _render(plot_context_view.el);
        });
        return doc.load();
      } else {
        msg = "Document '" + title + "' wasn't found on this server.";
        _render(msg);
        return logger.error(msg);
      }
    };
    _render = function(html) {
      return $('#PlotPane').append(html);
    };
    return {
      "inject_css": inject_css,
      "inject_plot": inject_plot,
      "add_plot_server": add_plot_server,
      "add_plot_static": add_plot_static,
      "server_page": server_page
    };
  });

}).call(this);

/*
//@ sourceMappingURL=embed.js.map
*/