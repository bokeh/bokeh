(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Interpolate, InterpolateView, Interpolates, _ref, _ref1, _ref2;
    InterpolateView = (function(_super) {
      __extends(InterpolateView, _super);

      function InterpolateView() {
        _ref = InterpolateView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      InterpolateView.prototype.attributes = {
        "class": "InterpolateView"
      };

      InterpolateView.prototype.initialize = function(options) {
        InterpolateView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      InterpolateView.prototype.delegateEvents = function(events) {
        InterpolateView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      InterpolateView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return InterpolateView;

    })(ContinuumView);
    Interpolate = (function(_super) {
      __extends(Interpolate, _super);

      function Interpolate() {
        _ref1 = Interpolate.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Interpolate.prototype.type = "Interpolate";

      Interpolate.prototype.default_view = InterpolateView;

      return Interpolate;

    })(HasParent);
    Interpolates = (function(_super) {
      __extends(Interpolates, _super);

      function Interpolates() {
        _ref2 = Interpolates.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Interpolates.prototype.model = Interpolate;

      return Interpolates;

    })(Collection);
    return {
      "Model": Interpolate,
      "Collection": new Interpolates()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=interpolate.js.map
*/