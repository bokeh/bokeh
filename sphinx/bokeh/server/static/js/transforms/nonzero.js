(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var NonZero, NonZeroView, NonZeros, _ref, _ref1, _ref2;
    NonZeroView = (function(_super) {
      __extends(NonZeroView, _super);

      function NonZeroView() {
        _ref = NonZeroView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      NonZeroView.prototype.attributes = {
        "class": "NonZeroView"
      };

      NonZeroView.prototype.initialize = function(options) {
        NonZeroView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      NonZeroView.prototype.delegateEvents = function(events) {
        NonZeroView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      NonZeroView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return NonZeroView;

    })(ContinuumView);
    NonZero = (function(_super) {
      __extends(NonZero, _super);

      function NonZero() {
        _ref1 = NonZero.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      NonZero.prototype.type = "NonZero";

      NonZero.prototype.default_view = NonZeroView;

      return NonZero;

    })(HasParent);
    NonZeros = (function(_super) {
      __extends(NonZeros, _super);

      function NonZeros() {
        _ref2 = NonZeros.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      NonZeros.prototype.model = NonZero;

      return NonZeros;

    })(Collection);
    return {
      "Model": NonZero,
      "Collection": new NonZeros()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=nonzero.js.map
*/