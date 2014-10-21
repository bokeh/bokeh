(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_properties", "ticking/basic_tick_formatter"], function(_, Collection, HasProperties, BasicTickFormatter) {
    var LogTickFormatter, LogTickFormatters, _ref, _ref1;
    LogTickFormatter = (function(_super) {
      __extends(LogTickFormatter, _super);

      function LogTickFormatter() {
        _ref = LogTickFormatter.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LogTickFormatter.prototype.type = 'LogTickFormatter';

      LogTickFormatter.prototype.initialize = function(attrs, options) {
        LogTickFormatter.__super__.initialize.call(this, attrs, options);
        return this.basic_formatter = new BasicTickFormatter.Model();
      };

      LogTickFormatter.prototype.format = function(ticks) {
        var i, labels, small_interval, _i, _ref1;
        if (ticks.length === 0) {
          return [];
        }
        small_interval = false;
        labels = new Array(ticks.length);
        for (i = _i = 0, _ref1 = ticks.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          labels[i] = "10^" + (Math.round(Math.log(ticks[i]) / Math.log(10)));
          if ((i > 0) && (labels[i] === labels[i - 1])) {
            small_interval = true;
            break;
          }
        }
        if (small_interval) {
          labels = this.basic_formatter.format(ticks);
        }
        return labels;
      };

      return LogTickFormatter;

    })(HasProperties);
    LogTickFormatters = (function(_super) {
      __extends(LogTickFormatters, _super);

      function LogTickFormatters() {
        _ref1 = LogTickFormatters.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LogTickFormatters.prototype.model = LogTickFormatter;

      return LogTickFormatters;

    })(Collection);
    return {
      "Model": LogTickFormatter,
      "Collection": new LogTickFormatters()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=log_tick_formatter.js.map
*/