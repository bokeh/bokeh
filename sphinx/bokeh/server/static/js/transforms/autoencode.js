(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var AutoEncode, AutoEncodeView, AutoEncodes, _ref, _ref1, _ref2;
    AutoEncodeView = (function(_super) {
      __extends(AutoEncodeView, _super);

      function AutoEncodeView() {
        _ref = AutoEncodeView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AutoEncodeView.prototype.attributes = {
        "class": "AutoEncodeView"
      };

      AutoEncodeView.prototype.initialize = function(options) {
        AutoEncodeView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      AutoEncodeView.prototype.delegateEvents = function(events) {
        AutoEncodeView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      AutoEncodeView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return AutoEncodeView;

    })(ContinuumView);
    AutoEncode = (function(_super) {
      __extends(AutoEncode, _super);

      function AutoEncode() {
        _ref1 = AutoEncode.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      AutoEncode.prototype.type = "AutoEncode";

      AutoEncode.prototype.default_view = AutoEncodeView;

      return AutoEncode;

    })(HasParent);
    AutoEncodes = (function(_super) {
      __extends(AutoEncodes, _super);

      function AutoEncodes() {
        _ref2 = AutoEncodes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      AutoEncodes.prototype.model = AutoEncode;

      return AutoEncodes;

    })(Collection);
    return {
      "Model": AutoEncode,
      "Collection": new AutoEncodes()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=autoencode.js.map
*/