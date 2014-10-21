(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./collection", "./build_views", "./has_parent", "./continuum_view"], function(_, Collection, build_views, HasParent, ContinuumView) {
    var PlotContext, PlotContextView, PlotContexts, _ref, _ref1, _ref2;
    PlotContextView = (function(_super) {
      __extends(PlotContextView, _super);

      function PlotContextView() {
        this.removeplot = __bind(this.removeplot, this);
        this.closeall = __bind(this.closeall, this);
        _ref = PlotContextView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PlotContextView.prototype.initialize = function(options) {
        this.views = {};
        this.child_models = [];
        PlotContextView.__super__.initialize.call(this, options);
        return this.render();
      };

      PlotContextView.prototype.delegateEvents = function() {
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'change', this.render);
        return PlotContextView.__super__.delegateEvents.call(this);
      };

      PlotContextView.prototype.build_children = function() {
        var created_views;
        created_views = build_views(this.views, this.mget('children'), {});
        window.pc_created_views = created_views;
        window.pc_views = this.views;
        return null;
      };

      PlotContextView.prototype.size_textarea = function(textarea) {
        var scrollHeight;
        scrollHeight = $(textarea).height(0).prop('scrollHeight');
        return $(textarea).height(scrollHeight);
      };

      PlotContextView.prototype.closeall = function(e) {
        this.mset('children', []);
        return this.model.save();
      };

      PlotContextView.prototype.removeplot = function(e) {
        var newchildren, plotnum, s_pc, view, x;
        plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'));
        s_pc = this.mget('children')[plotnum];
        view = this.views[s_pc.get('id')];
        view.remove();
        newchildren = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.mget('children');
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            x = _ref1[_i];
            if (x.id !== view.model.id) {
              _results.push(x);
            }
          }
          return _results;
        }).call(this);
        this.mset('children', newchildren);
        this.model.save();
        return false;
      };

      PlotContextView.prototype.render = function() {
        var index, key, modelref, node, numplots, tab_names, to_render, val, view, _i, _len, _ref1, _ref2,
          _this = this;
        PlotContextView.__super__.render.call(this);
        this.build_children();
        _ref1 = this.views;
        for (key in _ref1) {
          if (!__hasProp.call(_ref1, key)) continue;
          val = _ref1[key];
          val.$el.detach();
        }
        this.$el.html('');
        numplots = _.keys(this.views).length;
        to_render = [];
        tab_names = {};
        _ref2 = this.mget('children');
        for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
          modelref = _ref2[index];
          view = this.views[modelref.id];
          node = $("<div class='jsp' data-plot_num='" + index + "'></div>");
          this.$el.append(node);
          node.append(view.el);
        }
        _.defer(function() {
          var textarea, _j, _len1, _ref3, _results;
          _ref3 = _this.$el.find('.plottitle');
          _results = [];
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            textarea = _ref3[_j];
            _results.push(_this.size_textarea($(textarea)));
          }
          return _results;
        });
        return null;
      };

      return PlotContextView;

    })(ContinuumView);
    PlotContext = (function(_super) {
      __extends(PlotContext, _super);

      function PlotContext() {
        _ref1 = PlotContext.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PlotContext.prototype.type = 'PlotContext';

      PlotContext.prototype.default_view = PlotContextView;

      PlotContext.prototype.url = function() {
        return PlotContext.__super__.url.call(this);
      };

      PlotContext.prototype.defaults = function() {
        return _.extend({}, PlotContext.__super__.defaults.call(this), {
          children: []
        });
      };

      return PlotContext;

    })(HasParent);
    PlotContexts = (function(_super) {
      __extends(PlotContexts, _super);

      function PlotContexts() {
        _ref2 = PlotContexts.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PlotContexts.prototype.model = PlotContext;

      return PlotContexts;

    })(Collection);
    return {
      "Model": PlotContext,
      "Collection": new PlotContexts(),
      "View": PlotContextView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plot_context.js.map
*/