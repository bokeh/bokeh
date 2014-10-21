(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Spread, SpreadView, Spreads, _ref, _ref1, _ref2;
    SpreadView = (function(_super) {
      __extends(SpreadView, _super);

      function SpreadView() {
        _ref = SpreadView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SpreadView.prototype.attributes = {
        "class": "SpreadView"
      };

      SpreadView.prototype.initialize = function(options) {
        SpreadView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      SpreadView.prototype.delegateEvents = function(events) {
        SpreadView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      SpreadView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return SpreadView;

    })(ContinuumView);
    Spread = (function(_super) {
      __extends(Spread, _super);

      function Spread() {
        _ref1 = Spread.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Spread.prototype.type = "Spread";

      Spread.prototype.default_view = SpreadView;

      return Spread;

    })(HasParent);
    Spreads = (function(_super) {
      __extends(Spreads, _super);

      function Spreads() {
        _ref2 = Spreads.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Spreads.prototype.model = Spread;

      return Spreads;

    })(Collection);
    return {
      "Model": Spread,
      "Collection": new Spreads()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=spread.js.map
*/