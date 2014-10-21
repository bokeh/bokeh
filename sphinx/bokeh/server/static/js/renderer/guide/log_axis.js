(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "./axis", "ticking/log_ticker", "ticking/log_tick_formatter"], function(_, Collection, Axis, LogTicker, LogTickFormatter) {
    var LogAxes, LogAxis, LogAxisView, _ref, _ref1, _ref2;
    LogAxisView = (function(_super) {
      __extends(LogAxisView, _super);

      function LogAxisView() {
        _ref = LogAxisView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      return LogAxisView;

    })(Axis.View);
    LogAxis = (function(_super) {
      __extends(LogAxis, _super);

      function LogAxis() {
        _ref1 = LogAxis.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LogAxis.prototype.default_view = LogAxisView;

      LogAxis.prototype.type = 'LogAxis';

      LogAxis.prototype.initialize = function(attrs, objects) {
        LogAxis.__super__.initialize.call(this, attrs, objects);
        if (this.get('ticker') == null) {
          this.set_obj('ticker', LogTicker.Collection.create());
        }
        if (this.get('formatter') == null) {
          return this.set_obj('formatter', LogTickFormatter.Collection.create());
        }
      };

      return LogAxis;

    })(Axis.Model);
    LogAxes = (function(_super) {
      __extends(LogAxes, _super);

      function LogAxes() {
        _ref2 = LogAxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      LogAxes.prototype.model = LogAxis;

      return LogAxes;

    })(Collection);
    return {
      "Model": LogAxis,
      "Collection": new LogAxes(),
      "View": LogAxisView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=log_axis.js.map
*/