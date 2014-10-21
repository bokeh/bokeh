(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Id, IdView, Ids, _ref, _ref1, _ref2;
    IdView = (function(_super) {
      __extends(IdView, _super);

      function IdView() {
        _ref = IdView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      IdView.prototype.attributes = {
        "class": "IdView"
      };

      IdView.prototype.initialize = function(options) {
        IdView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      IdView.prototype.delegateEvents = function(events) {
        IdView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      IdView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return IdView;

    })(ContinuumView);
    Id = (function(_super) {
      __extends(Id, _super);

      function Id() {
        _ref1 = Id.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Id.prototype.type = "Id";

      Id.prototype.default_view = IdView;

      return Id;

    })(HasParent);
    Ids = (function(_super) {
      __extends(Ids, _super);

      function Ids() {
        _ref2 = Ids.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Ids.prototype.model = Id;

      return Ids;

    })(Collection);
    return {
      "Model": Id,
      "Collection": new Ids()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=id.js.map
*/