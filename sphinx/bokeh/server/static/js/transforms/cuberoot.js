(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Cuberoot, CuberootView, Cuberoots, _ref, _ref1, _ref2;
    CuberootView = (function(_super) {
      __extends(CuberootView, _super);

      function CuberootView() {
        _ref = CuberootView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CuberootView.prototype.attributes = {
        "class": "CuberootView"
      };

      CuberootView.prototype.initialize = function(options) {
        CuberootView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      CuberootView.prototype.delegateEvents = function(events) {
        CuberootView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      CuberootView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return CuberootView;

    })(ContinuumView);
    Cuberoot = (function(_super) {
      __extends(Cuberoot, _super);

      function Cuberoot() {
        _ref1 = Cuberoot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Cuberoot.prototype.type = "Cuberoot";

      Cuberoot.prototype.default_view = CuberootView;

      return Cuberoot;

    })(HasParent);
    Cuberoots = (function(_super) {
      __extends(Cuberoots, _super);

      function Cuberoots() {
        _ref2 = Cuberoots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Cuberoots.prototype.model = Cuberoot;

      return Cuberoots;

    })(Collection);
    return {
      "Model": Cuberoot,
      "Collection": new Cuberoots()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=cuberoot.js.map
*/