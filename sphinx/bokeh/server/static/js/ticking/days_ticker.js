(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "ticking/single_interval_ticker", "ticking/util"], function(_, Collection, SingleIntervalTicker, util) {
    var DaysTicker, DaysTickers, ONE_DAY, copy_date, date_range_by_month, last_month_no_later_than, _ref, _ref1;
    copy_date = util.copy_date;
    last_month_no_later_than = util.last_month_no_later_than;
    ONE_DAY = util.ONE_DAY;
    date_range_by_month = function(start_time, end_time) {
      var date, dates, end_date, prev_end_date, start_date;
      start_date = last_month_no_later_than(new Date(start_time));
      end_date = last_month_no_later_than(new Date(end_time));
      prev_end_date = copy_date(end_date);
      end_date.setUTCMonth(end_date.getUTCMonth() + 1);
      dates = [];
      date = start_date;
      while (true) {
        dates.push(copy_date(date));
        date.setUTCMonth(date.getUTCMonth() + 1);
        if (date > end_date) {
          break;
        }
      }
      return dates;
    };
    DaysTicker = (function(_super) {
      __extends(DaysTicker, _super);

      function DaysTicker() {
        _ref = DaysTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DaysTicker.prototype.type = 'DaysTicker';

      DaysTicker.prototype.initialize = function(attrs, options) {
        var days, interval;
        attrs.num_minor_ticks = 0;
        DaysTicker.__super__.initialize.call(this, attrs, options);
        days = this.get('days');
        interval = days.length > 1 ? (days[1] - days[0]) * ONE_DAY : 31 * ONE_DAY;
        return this.set('interval', interval);
      };

      DaysTicker.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var all_ticks, date, day_dates, days, days_of_month, interval, month_dates, ticks_in_range,
          _this = this;
        month_dates = date_range_by_month(data_low, data_high);
        days = this.get('days');
        days_of_month = function(month_date, interval) {
          var dates, day, day_date, future_date, _i, _len;
          dates = [];
          for (_i = 0, _len = days.length; _i < _len; _i++) {
            day = days[_i];
            day_date = copy_date(month_date);
            day_date.setUTCDate(day);
            future_date = new Date(day_date.getTime() + (interval / 2));
            if (future_date.getUTCMonth() === month_date.getUTCMonth()) {
              dates.push(day_date);
            }
          }
          return dates;
        };
        interval = this.get('interval');
        day_dates = _.flatten((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = month_dates.length; _i < _len; _i++) {
            date = month_dates[_i];
            _results.push(days_of_month(date, interval));
          }
          return _results;
        })());
        all_ticks = _.invoke(day_dates, 'getTime');
        ticks_in_range = _.filter(all_ticks, (function(tick) {
          return (data_low <= tick && tick <= data_high);
        }));
        return {
          "major": ticks_in_range,
          "minor": []
        };
      };

      DaysTicker.prototype.defaults = function() {
        return _.extend({}, DaysTicker.__super__.defaults.call(this), {
          toString_properties: ['days']
        });
      };

      return DaysTicker;

    })(SingleIntervalTicker.Model);
    DaysTickers = (function(_super) {
      __extends(DaysTickers, _super);

      function DaysTickers() {
        _ref1 = DaysTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DaysTickers.prototype.model = DaysTicker;

      return DaysTickers;

    })(Collection);
    return {
      "Model": DaysTicker,
      "Collection": new DaysTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=days_ticker.js.map
*/