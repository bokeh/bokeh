(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Seq, SeqView, Seqs, _ref, _ref1, _ref2;
    SeqView = (function(_super) {
      __extends(SeqView, _super);

      function SeqView() {
        _ref = SeqView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SeqView.prototype.attributes = {
        "class": "SeqView"
      };

      SeqView.prototype.initialize = function(options) {
        SeqView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      SeqView.prototype.delegateEvents = function(events) {
        SeqView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      SeqView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return SeqView;

    })(ContinuumView);
    Seq = (function(_super) {
      __extends(Seq, _super);

      function Seq() {
        _ref1 = Seq.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Seq.prototype.type = "Seq";

      Seq.prototype.default_view = SeqView;

      return Seq;

    })(HasParent);
    Seqs = (function(_super) {
      __extends(Seqs, _super);

      function Seqs() {
        _ref2 = Seqs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Seqs.prototype.model = Seq;

      return Seqs;

    })(Collection);
    return {
      "Model": Seq,
      "Collection": new Seqs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=seq.js.map
*/