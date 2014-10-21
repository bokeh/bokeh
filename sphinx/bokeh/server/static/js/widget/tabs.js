(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "bootstrap/tab", "common/collection", "common/continuum_view", "common/has_properties", "common/build_views", "./tabs_template"], function(_, $, $1, Collection, ContinuumView, HasProperties, build_views, tabs_template) {
    var Tabs, TabsView, Tabses, _ref, _ref1, _ref2;
    TabsView = (function(_super) {
      __extends(TabsView, _super);

      function TabsView() {
        _ref = TabsView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TabsView.prototype.initialize = function(options) {
        TabsView.__super__.initialize.call(this, options);
        this.views = {};
        return this.render();
      };

      TabsView.prototype.render = function() {
        var $panels, active, child, children, html, key, panel, tab, tabs, val, _i, _len, _ref1, _ref2, _ref3;
        _ref1 = this.views;
        for (key in _ref1) {
          if (!__hasProp.call(_ref1, key)) continue;
          val = _ref1[key];
          val.$el.detach();
        }
        this.$el.empty();
        tabs = this.mget('tabs');
        active = this.mget("active");
        children = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = tabs.length; _i < _len; _i++) {
            tab = tabs[_i];
            _results.push(tab.get("child"));
          }
          return _results;
        })();
        build_views(this.views, children);
        html = $(tabs_template({
          tabs: tabs,
          active: function(i) {
            if (i === active) {
              return 'bk-bs-active';
            } else {
              return '';
            }
          }
        }));
        html.find("> li > a").click(function(event) {
          event.preventDefault();
          return $(this).tab('show');
        });
        $panels = html.children(".bk-bs-tab-pane");
        _ref2 = _.zip(children, $panels);
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          _ref3 = _ref2[_i], child = _ref3[0], panel = _ref3[1];
          $(panel).html(this.views[child.id].$el);
        }
        this.$el.append(html);
        return this.$el.tabs;
      };

      return TabsView;

    })(ContinuumView);
    Tabs = (function(_super) {
      __extends(Tabs, _super);

      function Tabs() {
        _ref1 = Tabs.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Tabs.prototype.type = "Tabs";

      Tabs.prototype.default_view = TabsView;

      Tabs.prototype.defaults = function() {
        return _.extend({}, Tabs.__super__.defaults.call(this), {
          tabs: [],
          active: 0
        });
      };

      return Tabs;

    })(HasProperties);
    Tabses = (function(_super) {
      __extends(Tabses, _super);

      function Tabses() {
        _ref2 = Tabses.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Tabses.prototype.model = Tabs;

      return Tabses;

    })(Collection);
    return {
      Model: Tabs,
      Collection: new Tabses(),
      View: TabsView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tabs.js.map
*/