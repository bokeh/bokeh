(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Ratio, RatioView, Ratios, _ref, _ref1, _ref2;
    RatioView = (function(_super) {
      __extends(RatioView, _super);

      function RatioView() {
        _ref = RatioView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RatioView.prototype.attributes = {
        "class": "RatioView"
      };

      RatioView.prototype.initialize = function(options) {
        RatioView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      RatioView.prototype.delegateEvents = function(events) {
        RatioView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      RatioView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return RatioView;

    })(ContinuumView);
    Ratio = (function(_super) {
      __extends(Ratio, _super);

      function Ratio() {
        _ref1 = Ratio.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Ratio.prototype.type = "Ratio";

      Ratio.prototype.default_view = RatioView;

      return Ratio;

    })(HasParent);
    Ratios = (function(_super) {
      __extends(Ratios, _super);

      function Ratios() {
        _ref2 = Ratios.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Ratios.prototype.model = Ratio;

      return Ratios;

    })(Collection);
    return {
      "Model": Ratio,
      "Collection": new Ratios()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=ratio.js.map
*/