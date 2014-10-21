(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "common/base", "../serverutils", "common/continuum_view", "common/collection", "./userdocstemplate", "./documentationtemplate", "./wrappertemplate", "common/has_parent", "common/build_views", "common/load_models"], function(_, $, base, serverutils, ContinuumView, Collection, userdocstemplate, documentationtemplate, wrappertemplate, HasParent, build_views, load_models) {
    var Doc, DocView, UserDocs, UserDocsView, exports, utility, _ref, _ref1, _ref2, _ref3;
    exports = {};
    utility = serverutils.utility;
    DocView = (function(_super) {
      __extends(DocView, _super);

      function DocView() {
        _ref = DocView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DocView.prototype.template = wrappertemplate;

      DocView.prototype.attributes = {
        "class": 'panel-group'
      };

      DocView.prototype.events = {
        "click .bokehdoclabel": "loaddoc",
        "click .bokehdelete": "deldoc"
      };

      DocView.prototype.deldoc = function(e) {
        e.preventDefault();
        this.model.destroy();
        return false;
      };

      DocView.prototype.loaddoc = function() {
        return this.model.load();
      };

      DocView.prototype.initialize = function(options) {
        DocView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      DocView.prototype.delegateEvents = function(events) {
        DocView.__super__.delegateEvents.call(this, events);
        return this.listenTo(this.model, 'loaded', this.render);
      };

      DocView.prototype.render_init = function() {
        var html;
        html = this.template({
          model: this.model,
          bodyid: _.uniqueId()
        });
        return this.$el.html(html);
      };

      DocView.prototype.render = function() {
        var plot_context;
        plot_context = this.model.get('plot_context');
        this.plot_context_view = new plot_context.default_view({
          model: plot_context
        });
        this.$el.find('.plots').append(this.plot_context_view.el);
        return true;
      };

      return DocView;

    })(ContinuumView);
    UserDocsView = (function(_super) {
      __extends(UserDocsView, _super);

      function UserDocsView() {
        _ref1 = UserDocsView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      UserDocsView.prototype.initialize = function(options) {
        this.docs = options.docs;
        this.collection = options.collection;
        this.views = {};
        UserDocsView.__super__.initialize.call(this, options);
        return this.render();
      };

      UserDocsView.prototype.attributes = {
        "class": 'usercontext'
      };

      UserDocsView.prototype.events = {
        'click .bokehrefresh': function() {
          return this.collection.fetch({
            update: true
          });
        }
      };

      UserDocsView.prototype.delegateEvents = function(events) {
        var _this = this;
        UserDocsView.__super__.delegateEvents.call(this, events);
        this.listenTo(this.collection, 'add', this.render);
        this.listenTo(this.collection, 'remove', this.render);
        this.listenTo(this.collection, 'add', function(model, collection, options) {
          return _this.listenTo(model, 'loaded', function() {
            return _this.listenTo(model.get('plot_context'), 'change', function() {
              return _this.trigger('show');
            });
          });
        });
        return this.listenTo(this.collection, 'remove', function(model, collection, options) {
          return _this.stopListening(model);
        });
      };

      UserDocsView.prototype.render_docs = function() {
        this.$el.html(documentationtemplate());
        return this.$el.append(this.docs);
      };

      UserDocsView.prototype.render = function() {
        var html, model, models, _i, _len;
        if (this.collection.models.length === 0 && this.docs) {
          return this.render_docs();
        }
        html = userdocstemplate();
        _.map(_.values(this.views), function(view) {
          return view.$el.detach();
        });
        models = this.collection.models.slice().reverse();
        build_views(this.views, models, {});
        this.$el.html(html);
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          this.$el.find(".accordion").append(this.views[model.id].el);
        }
        return this;
      };

      return UserDocsView;

    })(ContinuumView);
    Doc = (function(_super) {
      __extends(Doc, _super);

      function Doc() {
        _ref2 = Doc.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Doc.prototype.default_view = DocView;

      Doc.prototype.idAttribute = 'docid';

      Doc.prototype.defaults = function() {
        return _.extend({}, Doc.__super__.defaults.call(this), {
          docid: null,
          title: null,
          plot_context: null,
          apikey: null
        });
      };

      Doc.prototype.sync = function() {};

      Doc.prototype.destroy = function(options) {
        Doc.__super__.destroy.call(this, options);
        return $.ajax({
          url: "/bokeh/doc/" + (this.get('docid')) + "/",
          type: 'delete'
        });
      };

      Doc.prototype.load = function(use_title) {
        var docid, resp, title,
          _this = this;
        if (this.loaded) {
          return;
        }
        if (use_title) {
          title = this.get('title');
          resp = utility.load_doc_by_title(title);
        } else {
          docid = this.get('docid');
          resp = utility.load_doc(docid);
        }
        return resp.done(function(data) {
          _this.set('docid', data.docid);
          _this.set('apikey', data['apikey']);
          _this.set('plot_context', data['plot_context_ref']);
          _this.trigger('loaded');
          return _this.loaded = true;
        });
      };

      return Doc;

    })(HasParent);
    UserDocs = (function(_super) {
      __extends(UserDocs, _super);

      function UserDocs() {
        _ref3 = UserDocs.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      UserDocs.prototype.model = Doc;

      UserDocs.prototype.subscribe = function(wswrapper, username) {
        wswrapper.subscribe("bokehuser:" + username, null);
        return this.listenTo(wswrapper, "msg:bokehuser:" + username, function(msg) {
          msg = JSON.parse(msg);
          if (msg['msgtype'] === 'docchange') {
            return this.fetch({
              update: true
            });
          }
        });
      };

      UserDocs.prototype.fetch = function(options) {
        var resp, response, url,
          _this = this;
        if (_.isUndefined(options)) {
          options = {};
        }
        url = base.Config.prefix + "bokeh/userinfo/";
        resp = response = $.get(url, {});
        resp.done(function(data) {
          var docs;
          docs = data['docs'];
          if (options.update) {
            return _this.set(docs, options);
          } else {
            return _this.reset(docs, options);
          }
        });
        return resp;
      };

      return UserDocs;

    })(Collection);
    exports.UserDocs = UserDocs;
    exports.UserDocsView = UserDocsView;
    exports.Doc = Doc;
    exports.DocView = DocView;
    return exports;
  });

}).call(this);

/*
//@ sourceMappingURL=usercontext.js.map
*/