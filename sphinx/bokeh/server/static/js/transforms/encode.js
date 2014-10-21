(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Encode, EncodeView, Encodes, _ref, _ref1, _ref2;
    EncodeView = (function(_super) {
      __extends(EncodeView, _super);

      function EncodeView() {
        _ref = EncodeView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      EncodeView.prototype.attributes = {
        "class": "EncodeView"
      };

      EncodeView.prototype.initialize = function(options) {
        EncodeView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      EncodeView.prototype.delegateEvents = function(events) {
        EncodeView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      EncodeView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return EncodeView;

    })(ContinuumView);
    Encode = (function(_super) {
      __extends(Encode, _super);

      function Encode() {
        _ref1 = Encode.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Encode.prototype.type = "Encode";

      Encode.prototype.default_view = EncodeView;

      return Encode;

    })(HasParent);
    Encodes = (function(_super) {
      __extends(Encodes, _super);

      function Encodes() {
        _ref2 = Encodes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Encodes.prototype.model = Encode;

      return Encodes;

    })(Collection);
    return {
      "Model": Encode,
      "Collection": new Encodes()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=encode.js.map
*/