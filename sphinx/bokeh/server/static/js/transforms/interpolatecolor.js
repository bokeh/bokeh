(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var InterpolateColor, InterpolateColorView, InterpolateColors, _ref, _ref1, _ref2;
    InterpolateColorView = (function(_super) {
      __extends(InterpolateColorView, _super);

      function InterpolateColorView() {
        _ref = InterpolateColorView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      InterpolateColorView.prototype.attributes = {
        "class": "InterpolateColorView"
      };

      InterpolateColorView.prototype.initialize = function(options) {
        InterpolateColorView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      InterpolateColorView.prototype.delegateEvents = function(events) {
        InterpolateColorView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      InterpolateColorView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return InterpolateColorView;

    })(ContinuumView);
    InterpolateColor = (function(_super) {
      __extends(InterpolateColor, _super);

      function InterpolateColor() {
        _ref1 = InterpolateColor.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      InterpolateColor.prototype.type = "InterpolateColor";

      InterpolateColor.prototype.default_view = InterpolateColorView;

      return InterpolateColor;

    })(HasParent);
    InterpolateColors = (function(_super) {
      __extends(InterpolateColors, _super);

      function InterpolateColors() {
        _ref2 = InterpolateColors.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      InterpolateColors.prototype.model = InterpolateColor;

      return InterpolateColors;

    })(Collection);
    return {
      "Model": InterpolateColor,
      "Collection": new InterpolateColors()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=interpolatecolor.js.map
*/