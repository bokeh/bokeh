(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "common/collection", "common/continuum_view", "common/has_properties"], function(_, $, Collection, ContinuumView, HasProperties) {
    var Panel, PanelView, Panels, _ref, _ref1, _ref2;
    PanelView = (function(_super) {
      __extends(PanelView, _super);

      function PanelView() {
        _ref = PanelView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PanelView.prototype.initialize = function(options) {
        PanelView.__super__.initialize.call(this, options);
        return this.render();
      };

      PanelView.prototype.render = function() {
        return this.$el.empty();
      };

      return PanelView;

    })(ContinuumView);
    Panel = (function(_super) {
      __extends(Panel, _super);

      function Panel() {
        _ref1 = Panel.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Panel.prototype.type = "Panel";

      Panel.prototype.default_view = PanelView;

      Panel.prototype.defaults = function() {
        return _.extend({}, Panel.__super__.defaults.call(this), {
          title: "",
          child: null,
          closable: false
        });
      };

      return Panel;

    })(HasProperties);
    Panels = (function(_super) {
      __extends(Panels, _super);

      function Panels() {
        _ref2 = Panels.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Panels.prototype.model = Panel;

      return Panels;

    })(Collection);
    return {
      Model: Panel,
      Collection: new Panels(),
      View: PanelView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=panel.js.map
*/