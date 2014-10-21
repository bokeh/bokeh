(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "sprintf", "timezone", "common/has_properties", "common/logging"], function(_, Collection, sprintf, tz, HasProperties, Logging) {
    var DatetimeTickFormatter, DatetimeTickFormatters, logger, _array, _four_digit_year, _ms_dot_us, _ref, _ref1, _strftime, _two_digit_year, _us;
    logger = Logging.logger;
    _us = function(t) {
      return sprintf("%3dus", Math.floor((t % 1) * 1000));
    };
    _ms_dot_us = function(t) {
      var ms, us;
      ms = Math.floor(((t / 1000) % 1) * 1000);
      us = Math.floor((t % 1) * 1000);
      return sprintf("%3d.%3dms", ms, us);
    };
    _two_digit_year = function(t) {
      var dt, year;
      dt = new Date(t);
      year = dt.getFullYear();
      if (dt.getMonth() >= 7) {
        year += 1;
      }
      return sprintf("'%02d", year % 100);
    };
    _four_digit_year = function(t) {
      var dt, year;
      dt = new Date(t);
      year = dt.getFullYear();
      if (dt.getMonth() >= 7) {
        year += 1;
      }
      return sprintf("%d", year);
    };
    _array = function(t) {
      return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map(function(e) {
        return parseInt(e, 10);
      });
    };
    _strftime = function(t, format) {
      if (_.isFunction(format)) {
        return format(t);
      } else {
        return tz(t, format);
      }
    };
    DatetimeTickFormatter = (function(_super) {
      __extends(DatetimeTickFormatter, _super);

      function DatetimeTickFormatter() {
        _ref = DatetimeTickFormatter.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DatetimeTickFormatter.prototype.type = 'DatetimeTickFormatter';

      DatetimeTickFormatter.prototype.format_order = ['microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'];

      DatetimeTickFormatter.prototype._formats = {
        'microseconds': [_us, _ms_dot_us],
        'milliseconds': ['%3Nms', '%S.%3Ns'],
        'seconds': ['%Ss'],
        'minsec': [':%M:%S'],
        'minutes': [':%M', '%Mm'],
        'hourmin': ['%H:%M'],
        'hours': ['%Hh', '%H:%M'],
        'days': ['%m/%d', '%a%d'],
        'months': ['%m/%Y', '%b%y'],
        'years': ['%Y', _two_digit_year, _four_digit_year]
      };

      DatetimeTickFormatter.prototype.strip_leading_zeros = true;

      DatetimeTickFormatter.prototype.initialize = function(attrs, options) {
        var fmt, fmt_name, fmt_string, fmt_strings, now, sizes, sorted, _results;
        DatetimeTickFormatter.__super__.initialize.call(this, attrs, options);
        fmt = _.extend({}, this._formats, this.get("formats"));
        now = tz(new Date());
        this.formats = {};
        _results = [];
        for (fmt_name in fmt) {
          fmt_strings = fmt[fmt_name];
          sizes = (function() {
            var _i, _len, _results1;
            _results1 = [];
            for (_i = 0, _len = fmt_strings.length; _i < _len; _i++) {
              fmt_string = fmt_strings[_i];
              _results1.push(_strftime(now, fmt_string).length);
            }
            return _results1;
          })();
          sorted = _.sortBy(_.zip(sizes, fmt_strings), function(_arg) {
            var fmt, size;
            size = _arg[0], fmt = _arg[1];
            return size;
          });
          _results.push(this.formats[fmt_name] = _.zip.apply(_, sorted));
        }
        return _results;
      };

      DatetimeTickFormatter.prototype._get_resolution_str = function(resolution_secs, span_secs) {
        var adjusted_resolution_secs, str;
        adjusted_resolution_secs = resolution_secs * 1.1;
        if (adjusted_resolution_secs < 1e-3) {
          str = "microseconds";
        } else if (adjusted_resolution_secs < 1.0) {
          str = "milliseconds";
        } else if (adjusted_resolution_secs < 60) {
          if (span_secs >= 60) {
            str = "minsec";
          } else {
            str = "seconds";
          }
        } else if (adjusted_resolution_secs < 3600) {
          if (span_secs >= 3600) {
            str = "hourmin";
          } else {
            str = "minutes";
          }
        } else if (adjusted_resolution_secs < 24 * 3600) {
          str = "hours";
        } else if (adjusted_resolution_secs < 31 * 24 * 3600) {
          str = "days";
        } else if (adjusted_resolution_secs < 365 * 24 * 3600) {
          str = "months";
        } else {
          str = "years";
        }
        return str;
      };

      DatetimeTickFormatter.prototype.format = function(ticks, num_labels, char_width, fill_ratio, ticker) {
        var error, fmt, format, formats, good_formats, hybrid_handled, i, labels, next_format, next_ndx, r, resol, resol_ndx, s, span, ss, t, time_tuple_ndx_for_resol, tm, widths, _i, _j, _k, _len, _len1, _ref1, _ref2, _ref3;
        if (num_labels == null) {
          num_labels = null;
        }
        if (char_width == null) {
          char_width = null;
        }
        if (fill_ratio == null) {
          fill_ratio = 0.3;
        }
        if (ticker == null) {
          ticker = null;
        }
        if (ticks.length === 0) {
          return [];
        }
        span = Math.abs(ticks[ticks.length - 1] - ticks[0]) / 1000.0;
        if (ticker) {
          r = ticker.resolution;
        } else {
          r = span / (ticks.length - 1);
        }
        resol = this._get_resolution_str(r, span);
        _ref1 = this.formats[resol], widths = _ref1[0], formats = _ref1[1];
        format = formats[0];
        if (char_width) {
          good_formats = [];
          for (i = _i = 0, _ref2 = widths.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
            if (widths[i] * ticks.length < fill_ratio * char_width) {
              good_formats.push(this.formats[i]);
            }
          }
          if (good_formats.length > 0) {
            format = _.last(good_formats);
          }
        }
        labels = [];
        resol_ndx = this.format_order.indexOf(resol);
        time_tuple_ndx_for_resol = {};
        _ref3 = this.format_order;
        for (_j = 0, _len = _ref3.length; _j < _len; _j++) {
          fmt = _ref3[_j];
          time_tuple_ndx_for_resol[fmt] = 0;
        }
        time_tuple_ndx_for_resol["seconds"] = 5;
        time_tuple_ndx_for_resol["minsec"] = 4;
        time_tuple_ndx_for_resol["minutes"] = 4;
        time_tuple_ndx_for_resol["hourmin"] = 3;
        time_tuple_ndx_for_resol["hours"] = 3;
        for (_k = 0, _len1 = ticks.length; _k < _len1; _k++) {
          t = ticks[_k];
          try {
            tm = _array(t);
            s = _strftime(t, format);
          } catch (_error) {
            error = _error;
            logger.warn("unable to format tick for timestamp value " + t);
            logger.warn(" - " + error);
            labels.push("ERR");
            continue;
          }
          hybrid_handled = false;
          next_ndx = resol_ndx;
          while (tm[time_tuple_ndx_for_resol[this.format_order[next_ndx]]] === 0) {
            next_ndx += 1;
            if (next_ndx === this.format_order.length) {
              break;
            }
            if ((resol === "minsec" || resol === "hourmin") && !hybrid_handled) {
              if ((resol === "minsec" && tm[4] === 0 && tm[5] !== 0) || (resol === "hourmin" && tm[3] === 0 && tm[4] !== 0)) {
                next_format = this.formats[this.format_order[resol_ndx - 1]][1][0];
                s = _strftime(t, next_format);
                break;
              } else {
                hybrid_handled = true;
              }
            }
            next_format = this.formats[this.format_order[next_ndx]][1][0];
            s = _strftime(t, next_format);
          }
          if (this.strip_leading_zeros) {
            ss = s.replace(/^0+/g, "");
            if (ss !== s && (ss === '' || !isFinite(ss[0]))) {
              ss = '0' + ss;
            }
            labels.push(ss);
          } else {
            labels.push(s);
          }
        }
        return labels;
      };

      DatetimeTickFormatter.prototype.defaults = function() {
        return _.extend({}, DatetimeTickFormatter.__super__.defaults.call(this), {
          formats: {}
        });
      };

      return DatetimeTickFormatter;

    })(HasProperties);
    DatetimeTickFormatters = (function(_super) {
      __extends(DatetimeTickFormatters, _super);

      function DatetimeTickFormatters() {
        _ref1 = DatetimeTickFormatters.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DatetimeTickFormatters.prototype.model = DatetimeTickFormatter;

      return DatetimeTickFormatters;

    })(Collection);
    return {
      "Model": DatetimeTickFormatter,
      "Collection": new DatetimeTickFormatters()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=datetime_tick_formatter.js.map
*/