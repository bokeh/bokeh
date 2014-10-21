(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "ticking/adaptive_ticker"], function(Collection, AdaptiveTicker) {
    var LogTicker, LogTickers, range, _ref, _ref1;
    range = function(start, stop, step) {
      var i, result;
      if (typeof stop === "undefined") {
        stop = start;
        start = 0;
      }
      if (typeof step === "undefined") {
        step = 1;
      }
      if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
      }
      result = [];
      i = start;
      while ((step > 0 ? i < stop : i > stop)) {
        result.push(i);
        i += step;
      }
      return result;
    };
    LogTicker = (function(_super) {
      __extends(LogTicker, _super);

      function LogTicker() {
        _ref = LogTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LogTicker.prototype.type = 'LogTicker';

      LogTicker.prototype.initialize = function(attrs, options) {
        return LogTicker.__super__.initialize.call(this, attrs, options);
      };

      LogTicker.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var end_factor, endlog, factor, factors, i, interval, log_high, log_interval, log_low, minor_interval, minor_offsets, minor_ticks, num_minor_ticks, start_factor, startlog, tick, ticks, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref1;
        num_minor_ticks = this.get('num_minor_ticks');
        minor_ticks = [];
        if (data_low <= 0) {
          data_low = 1;
        }
        if (data_low > data_high) {
          _ref1 = [data_high, data_low], data_low = _ref1[0], data_high = _ref1[1];
        }
        log_low = Math.log(data_low) / Math.log(10);
        log_high = Math.log(data_high) / Math.log(10);
        log_interval = log_high - log_low;
        if (log_interval < 2) {
          interval = this.get_interval(data_low, data_high, desired_n_ticks);
          start_factor = Math.floor(data_low / interval);
          end_factor = Math.ceil(data_high / interval);
          if (_.isNaN(start_factor) || _.isNaN(end_factor)) {
            factors = [];
          } else {
            factors = _.range(start_factor, end_factor + 1);
          }
          ticks = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = factors.length; _i < _len; _i++) {
              factor = factors[_i];
              if (factor !== 0) {
                _results.push(factor * interval);
              }
            }
            return _results;
          })();
          if (num_minor_ticks > 1) {
            minor_interval = interval / num_minor_ticks;
            minor_offsets = (function() {
              var _i, _results;
              _results = [];
              for (i = _i = 1; 1 <= num_minor_ticks ? _i <= num_minor_ticks : _i >= num_minor_ticks; i = 1 <= num_minor_ticks ? ++_i : --_i) {
                _results.push(i * minor_interval);
              }
              return _results;
            })();
            for (_i = 0, _len = minor_offsets.length; _i < _len; _i++) {
              x = minor_offsets[_i];
              minor_ticks.push(ticks[0] - x);
            }
            for (_j = 0, _len1 = ticks.length; _j < _len1; _j++) {
              tick = ticks[_j];
              for (_k = 0, _len2 = minor_offsets.length; _k < _len2; _k++) {
                x = minor_offsets[_k];
                minor_ticks.push(tick + x);
              }
            }
          }
        } else {
          startlog = Math.ceil(log_low);
          endlog = Math.floor(log_high);
          interval = Math.ceil((endlog - startlog) / 9.0);
          ticks = range(startlog, endlog, interval);
          if ((endlog - startlog) % interval === 0) {
            ticks = ticks.concat([endlog]);
          }
          ticks = ticks.map(function(i) {
            return Math.pow(10, i);
          });
          if (num_minor_ticks > 1) {
            minor_interval = Math.pow(10, interval) / num_minor_ticks;
            minor_offsets = (function() {
              var _l, _results;
              _results = [];
              for (i = _l = 1; 1 <= num_minor_ticks ? _l <= num_minor_ticks : _l >= num_minor_ticks; i = 1 <= num_minor_ticks ? ++_l : --_l) {
                _results.push(i * minor_interval);
              }
              return _results;
            })();
            for (_l = 0, _len3 = minor_offsets.length; _l < _len3; _l++) {
              x = minor_offsets[_l];
              minor_ticks.push(ticks[0] / x);
            }
            for (_m = 0, _len4 = ticks.length; _m < _len4; _m++) {
              tick = ticks[_m];
              for (_n = 0, _len5 = minor_offsets.length; _n < _len5; _n++) {
                x = minor_offsets[_n];
                minor_ticks.push(tick * x);
              }
            }
          }
        }
        return {
          "major": ticks,
          "minor": minor_ticks
        };
      };

      LogTicker.prototype.defaults = function() {
        return _.extend({}, LogTicker.__super__.defaults.call(this), {
          mantissas: [1, 5]
        });
      };

      return LogTicker;

    })(AdaptiveTicker.Model);
    LogTickers = (function(_super) {
      __extends(LogTickers, _super);

      function LogTickers() {
        _ref1 = LogTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LogTickers.prototype.model = LogTicker;

      return LogTickers;

    })(Collection);
    return {
      "Model": LogTicker,
      "Collection": new LogTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=log_ticker.js.map
*/