(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var BinarySegment, BinarySegmentView, BinarySegments, _ref, _ref1, _ref2;
    BinarySegmentView = (function(_super) {
      __extends(BinarySegmentView, _super);

      function BinarySegmentView() {
        _ref = BinarySegmentView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BinarySegmentView.prototype.attributes = {
        "class": "BinarySegmentView"
      };

      BinarySegmentView.prototype.initialize = function(options) {
        BinarySegmentView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      BinarySegmentView.prototype.delegateEvents = function(events) {
        BinarySegmentView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      BinarySegmentView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return BinarySegmentView;

    })(ContinuumView);
    BinarySegment = (function(_super) {
      __extends(BinarySegment, _super);

      function BinarySegment() {
        _ref1 = BinarySegment.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BinarySegment.prototype.type = "BinarySegment";

      BinarySegment.prototype.default_view = BinarySegmentView;

      return BinarySegment;

    })(HasParent);
    BinarySegments = (function(_super) {
      __extends(BinarySegments, _super);

      function BinarySegments() {
        _ref2 = BinarySegments.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      BinarySegments.prototype.model = BinarySegment;

      return BinarySegments;

    })(Collection);
    return {
      "Model": BinarySegment,
      "Collection": new BinarySegments()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=binarysegment.js.map
*/