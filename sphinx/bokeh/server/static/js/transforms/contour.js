(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Contour, ContourView, Contours, _ref, _ref1, _ref2;
    ContourView = (function(_super) {
      __extends(ContourView, _super);

      function ContourView() {
        _ref = ContourView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ContourView.prototype.attributes = {
        "class": "ContourView"
      };

      ContourView.prototype.initialize = function(options) {
        ContourView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      ContourView.prototype.delegateEvents = function(events) {
        ContourView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      ContourView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return ContourView;

    })(ContinuumView);
    Contour = (function(_super) {
      __extends(Contour, _super);

      function Contour() {
        _ref1 = Contour.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Contour.prototype.type = "Contour";

      Contour.prototype.default_view = ContourView;

      return Contour;

    })(HasParent);
    Contours = (function(_super) {
      __extends(Contours, _super);

      function Contours() {
        _ref2 = Contours.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Contours.prototype.model = Contour;

      return Contours;

    })(Collection);
    return {
      "Model": Contour,
      "Collection": new Contours()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=contour.js.map
*/