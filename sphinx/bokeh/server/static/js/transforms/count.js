(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Count, CountView, Counts, _ref, _ref1, _ref2;
    CountView = (function(_super) {
      __extends(CountView, _super);

      function CountView() {
        _ref = CountView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CountView.prototype.attributes = {
        "class": "CountView"
      };

      CountView.prototype.initialize = function(options) {
        CountView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      CountView.prototype.delegateEvents = function(events) {
        CountView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      CountView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return CountView;

    })(ContinuumView);
    Count = (function(_super) {
      __extends(Count, _super);

      function Count() {
        _ref1 = Count.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Count.prototype.type = "Count";

      Count.prototype.default_view = CountView;

      return Count;

    })(HasParent);
    Counts = (function(_super) {
      __extends(Counts, _super);

      function Counts() {
        _ref2 = Counts.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Counts.prototype.model = Count;

      return Counts;

    })(Collection);
    return {
      "Model": Count,
      "Collection": new Counts()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=count.js.map
*/