(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var HDAlpha, HDAlphaView, HDAlphas, _ref, _ref1, _ref2;
    HDAlphaView = (function(_super) {
      __extends(HDAlphaView, _super);

      function HDAlphaView() {
        _ref = HDAlphaView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HDAlphaView.prototype.attributes = {
        "class": "HDAlphaView"
      };

      HDAlphaView.prototype.initialize = function(options) {
        HDAlphaView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      HDAlphaView.prototype.delegateEvents = function(events) {
        HDAlphaView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      HDAlphaView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return HDAlphaView;

    })(ContinuumView);
    HDAlpha = (function(_super) {
      __extends(HDAlpha, _super);

      function HDAlpha() {
        _ref1 = HDAlpha.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      HDAlpha.prototype.type = "HDAlpha";

      HDAlpha.prototype.default_view = HDAlphaView;

      return HDAlpha;

    })(HasParent);
    HDAlphas = (function(_super) {
      __extends(HDAlphas, _super);

      function HDAlphas() {
        _ref2 = HDAlphas.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      HDAlphas.prototype.model = HDAlpha;

      return HDAlphas;

    })(Collection);
    return {
      "Model": HDAlpha,
      "Collection": new HDAlphas()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=hdalpha.js.map
*/