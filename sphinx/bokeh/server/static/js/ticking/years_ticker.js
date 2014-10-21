(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "ticking/basic_ticker", "ticking/single_interval_ticker", "ticking/util"], function(_, Collection, BasicTicker, SingleIntervalTicker, util) {
    var ONE_YEAR, YearsTicker, YearsTickers, last_year_no_later_than, _ref, _ref1;
    last_year_no_later_than = util.last_year_no_later_than;
    ONE_YEAR = util.ONE_YEAR;
    YearsTicker = (function(_super) {
      __extends(YearsTicker, _super);

      function YearsTicker() {
        _ref = YearsTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      YearsTicker.prototype.type = 'YearsTicker';

      YearsTicker.prototype.initialize = function(attrs, options) {
        YearsTicker.__super__.initialize.call(this, attrs, options);
        this.set('interval', ONE_YEAR);
        return this.basic_ticker = new BasicTicker.Model({
          num_minor_ticks: 0
        });
      };

      YearsTicker.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var all_ticks, end_year, start_year, ticks_in_range, year, years;
        start_year = last_year_no_later_than(new Date(data_low)).getUTCFullYear();
        end_year = last_year_no_later_than(new Date(data_high)).getUTCFullYear();
        years = this.basic_ticker.get_ticks_no_defaults(start_year, end_year, desired_n_ticks).major;
        all_ticks = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = years.length; _i < _len; _i++) {
            year = years[_i];
            _results.push(Date.UTC(year, 0, 1));
          }
          return _results;
        })();
        ticks_in_range = _.filter(all_ticks, (function(tick) {
          return (data_low <= tick && tick <= data_high);
        }));
        return {
          "major": ticks_in_range,
          "minor": []
        };
      };

      YearsTicker.prototype.defaults = function() {
        return _.extend({}, YearsTicker.__super__.defaults.call(this), {
          toString_properties: ['years']
        });
      };

      return YearsTicker;

    })(SingleIntervalTicker.Model);
    YearsTickers = (function(_super) {
      __extends(YearsTickers, _super);

      function YearsTickers() {
        _ref1 = YearsTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      YearsTickers.prototype.model = YearsTicker;

      return YearsTickers;

    })(Collection);
    return {
      "Model": YearsTicker,
      "Collection": new YearsTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=years_ticker.js.map
*/