(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var ToCounts, ToCountsView, ToCountss, _ref, _ref1, _ref2;
    ToCountsView = (function(_super) {
      __extends(ToCountsView, _super);

      function ToCountsView() {
        _ref = ToCountsView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ToCountsView.prototype.attributes = {
        "class": "ToCountsView"
      };

      ToCountsView.prototype.initialize = function(options) {
        ToCountsView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      ToCountsView.prototype.delegateEvents = function(events) {
        ToCountsView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      ToCountsView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return ToCountsView;

    })(ContinuumView);
    ToCounts = (function(_super) {
      __extends(ToCounts, _super);

      function ToCounts() {
        _ref1 = ToCounts.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ToCounts.prototype.type = "ToCounts";

      ToCounts.prototype.default_view = ToCountsView;

      return ToCounts;

    })(HasParent);
    ToCountss = (function(_super) {
      __extends(ToCountss, _super);

      function ToCountss() {
        _ref2 = ToCountss.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ToCountss.prototype.model = ToCounts;

      return ToCountss;

    })(Collection);
    return {
      "Model": ToCounts,
      "Collection": new ToCountss()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tocounts.js.map
*/