(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/continuum_view", "common/collection", "common/has_parent"], function(ContinuumView, Collection, HasParent) {
    var Log, LogView, Logs, _ref, _ref1, _ref2;
    LogView = (function(_super) {
      __extends(LogView, _super);

      function LogView() {
        _ref = LogView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LogView.prototype.attributes = {
        "class": "LogView"
      };

      LogView.prototype.initialize = function(options) {
        LogView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      LogView.prototype.delegateEvents = function(events) {
        LogView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      LogView.prototype.render_init = function() {
        return this.$el.html("");
      };

      return LogView;

    })(ContinuumView);
    Log = (function(_super) {
      __extends(Log, _super);

      function Log() {
        _ref1 = Log.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Log.prototype.type = "Log";

      Log.prototype.default_view = LogView;

      return Log;

    })(HasParent);
    Logs = (function(_super) {
      __extends(Logs, _super);

      function Logs() {
        _ref2 = Logs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Logs.prototype.model = Log;

      return Logs;

    })(Collection);
    return {
      "Model": Log,
      "Collection": new Logs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=log.js.map
*/