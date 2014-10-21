(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "ticking/adaptive_ticker", "ticking/composite_ticker", "ticking/days_ticker", "ticking/months_ticker", "ticking/years_ticker", "ticking/util"], function(_, Collection, AdaptiveTicker, CompositeTicker, DaysTicker, MonthsTicker, YearsTicker, util) {
    var DatetimeTicker, DatetimeTickers, ONE_HOUR, ONE_MILLI, ONE_MINUTE, ONE_MONTH, ONE_SECOND, _ref, _ref1;
    ONE_MILLI = util.ONE_MILLI;
    ONE_SECOND = util.ONE_SECOND;
    ONE_MINUTE = util.ONE_MINUTE;
    ONE_HOUR = util.ONE_HOUR;
    ONE_MONTH = util.ONE_MONTH;
    DatetimeTicker = (function(_super) {
      __extends(DatetimeTicker, _super);

      function DatetimeTicker() {
        _ref = DatetimeTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DatetimeTicker.prototype.type = 'DatetimeTicker';

      DatetimeTicker.prototype.defaults = function() {
        return _.extend({}, DatetimeTicker.__super__.defaults.call(this), {
          num_minor_ticks: 0,
          tickers: [
            new AdaptiveTicker.Model({
              mantissas: [1, 2, 5],
              base: 10,
              min_interval: 0,
              max_interval: 500 * ONE_MILLI,
              num_minor_ticks: 0
            }), new AdaptiveTicker.Model({
              mantissas: [1, 2, 5, 10, 15, 20, 30],
              base: 60,
              min_interval: ONE_SECOND,
              max_interval: 30 * ONE_MINUTE,
              num_minor_ticks: 0
            }), new AdaptiveTicker.Model({
              mantissas: [1, 2, 4, 6, 8, 12],
              base: 24.0,
              min_interval: ONE_HOUR,
              max_interval: 12 * ONE_HOUR,
              num_minor_ticks: 0
            }), new DaysTicker.Model({
              days: _.range(1, 32)
            }), new DaysTicker.Model({
              days: _.range(1, 31, 3)
            }), new DaysTicker.Model({
              days: [1, 8, 15, 22]
            }), new DaysTicker.Model({
              days: [1, 15]
            }), new MonthsTicker.Model({
              months: _.range(0, 12, 1)
            }), new MonthsTicker.Model({
              months: _.range(0, 12, 2)
            }), new MonthsTicker.Model({
              months: _.range(0, 12, 4)
            }), new MonthsTicker.Model({
              months: _.range(0, 12, 6)
            }), new YearsTicker.Model({})
          ]
        });
      };

      return DatetimeTicker;

    })(CompositeTicker.Model);
    DatetimeTickers = (function(_super) {
      __extends(DatetimeTickers, _super);

      function DatetimeTickers() {
        _ref1 = DatetimeTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DatetimeTickers.prototype.model = DatetimeTicker;

      return DatetimeTickers;

    })(Collection);
    return {
      "Model": DatetimeTicker,
      "Collection": new DatetimeTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=datetime_ticker.js.map
*/