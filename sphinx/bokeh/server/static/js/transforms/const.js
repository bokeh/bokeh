(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Const, ConstView, Consts, _ref, _ref1, _ref2;
    ConstView = (function(_super) {
      __extends(ConstView, _super);

      function ConstView() {
        _ref = ConstView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ConstView.prototype.attributes = {
        "class": "ConstView"
      };

      ConstView.prototype.initialize = function(options) {
        ConstView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      ConstView.prototype.delegateEvents = function(events) {
        ConstView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      ConstView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return ConstView;

    })(ContinuumView);
    Const = (function(_super) {
      __extends(Const, _super);

      function Const() {
        _ref1 = Const.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Const.prototype.type = "Const";

      Const.prototype.default_view = ConstView;

      return Const;

    })(HasParent);
    Consts = (function(_super) {
      __extends(Consts, _super);

      function Consts() {
        _ref2 = Consts.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Consts.prototype.model = Const;

      return Consts;

    })(Collection);
    return {
      "Model": Const,
      "Collection": new Consts()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=const.js.map
*/