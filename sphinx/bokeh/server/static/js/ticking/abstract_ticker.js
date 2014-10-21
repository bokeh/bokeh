(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_properties"], function(_, Collection, HasProperties) {
    var AbstractTicker, AbstractTickers, DEFAULT_DESIRED_N_TICKS, repr, _ref, _ref1;
    repr = function(obj) {
      var elem, elems_str, key, obj_as_string, props_str;
      if (obj === null) {
        return "null";
      }
      if (obj == null) {
        return "undefined";
      } else if (obj.constructor === Array) {
        elems_str = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            elem = obj[_i];
            _results.push(repr(elem));
          }
          return _results;
        })()).join(", ");
        return "[" + elems_str + "]";
      } else if (obj.constructor === Object) {
        props_str = ((function() {
          var _results;
          _results = [];
          for (key in obj) {
            _results.push("" + key + ": " + (repr(obj[key])));
          }
          return _results;
        })()).join(", ");
        return "{" + props_str + "}";
      } else if (obj.constructor === String) {
        return "\"" + obj + "\"";
      } else if (obj.constructor === Function) {
        return "<Function: " + obj.name + ">";
      } else {
        obj_as_string = obj.toString();
        if (obj_as_string === "[object Object]") {
          return "<" + obj.constructor.name + ">";
        } else {
          return obj_as_string;
        }
      }
    };
    DEFAULT_DESIRED_N_TICKS = 6;
    AbstractTicker = (function(_super) {
      __extends(AbstractTicker, _super);

      function AbstractTicker() {
        _ref = AbstractTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AbstractTicker.prototype.type = 'AbstractTicker';

      AbstractTicker.prototype.initialize = function(attrs, options) {
        return AbstractTicker.__super__.initialize.call(this, attrs, options);
      };

      AbstractTicker.prototype.get_ticks = function(data_low, data_high, range, _arg) {
        var desired_n_ticks;
        desired_n_ticks = _arg.desired_n_ticks;
        if (desired_n_ticks == null) {
          desired_n_ticks = DEFAULT_DESIRED_N_TICKS;
        }
        return this.get_ticks_no_defaults(data_low, data_high, desired_n_ticks);
      };

      AbstractTicker.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var end_factor, factor, factors, i, interval, minor_interval, minor_offsets, minor_ticks, num_minor_ticks, start_factor, tick, ticks, x, _i, _j, _k, _len, _len1, _len2;
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
            _results.push(factor * interval);
          }
          return _results;
        })();
        num_minor_ticks = this.get("num_minor_ticks");
        minor_ticks = [];
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
        return {
          "major": ticks,
          "minor": minor_ticks
        };
      };

      AbstractTicker.prototype.get_interval = void 0;

      AbstractTicker.prototype.get_min_interval = function() {
        return this.get('min_interval');
      };

      AbstractTicker.prototype.get_max_interval = function() {
        return this.get('max_interval');
      };

      AbstractTicker.prototype.toString = function() {
        var class_name, key, params_str, props;
        class_name = typeof this;
        props = this.get('toString_properties');
        params_str = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = props.length; _i < _len; _i++) {
            key = props[_i];
            _results.push("" + key + "=" + (repr(this[key])));
          }
          return _results;
        }).call(this)).join(", ");
        return "" + class_name + "(" + params_str + ")";
      };

      AbstractTicker.prototype.get_ideal_interval = function(data_low, data_high, desired_n_ticks) {
        var data_range;
        data_range = data_high - data_low;
        return data_range / desired_n_ticks;
      };

      AbstractTicker.prototype.defaults = function() {
        return _.extend({}, AbstractTicker.__super__.defaults.call(this), {
          toString_properties: [],
          num_minor_ticks: 5
        });
      };

      return AbstractTicker;

    })(HasProperties);
    AbstractTickers = (function(_super) {
      __extends(AbstractTickers, _super);

      function AbstractTickers() {
        _ref1 = AbstractTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      AbstractTickers.prototype.model = AbstractTicker;

      return AbstractTickers;

    })(Collection);
    return {
      "Model": AbstractTicker,
      "Collection": new AbstractTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=abstract_ticker.js.map
*/