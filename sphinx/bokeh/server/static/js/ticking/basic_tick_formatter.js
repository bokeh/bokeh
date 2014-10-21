(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_properties"], function(_, Collection, HasProperties) {
    var BasicTickFormatter, BasicTickFormatters, _ref, _ref1;
    BasicTickFormatter = (function(_super) {
      __extends(BasicTickFormatter, _super);

      function BasicTickFormatter() {
        _ref = BasicTickFormatter.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BasicTickFormatter.prototype.type = 'BasicTickFormatter';

      BasicTickFormatter.prototype.initialize = function(attrs, options) {
        BasicTickFormatter.__super__.initialize.call(this, attrs, options);
        this.register_property('scientific_limit_low', function() {
          return Math.pow(10.0, this.get('power_limit_low'));
        }, true);
        this.add_dependencies('scientific_limit_low', this, ['power_limit_low']);
        this.register_property('scientific_limit_high', function() {
          return Math.pow(10.0, this.get('power_limit_high'));
        }, true);
        this.add_dependencies('scientific_limit_high', this, ['power_limit_high']);
        return this.last_precision = 3;
      };

      BasicTickFormatter.prototype.format = function(ticks) {
        var i, is_ok, labels, need_sci, precision, tick, tick_abs, x, zero_eps, _i, _j, _k, _l, _len, _m, _n, _ref1, _ref2, _ref3, _ref4, _ref5;
        if (ticks.length === 0) {
          return [];
        }
        zero_eps = 0;
        if (ticks.length >= 2) {
          zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000;
        }
        need_sci = false;
        if (this.get('use_scientific')) {
          for (_i = 0, _len = ticks.length; _i < _len; _i++) {
            tick = ticks[_i];
            tick_abs = Math.abs(tick);
            if (tick_abs > zero_eps && (tick_abs >= this.get('scientific_limit_high') || tick_abs <= this.get('scientific_limit_low'))) {
              need_sci = true;
              break;
            }
          }
        }
        precision = this.get('precision');
        if ((precision == null) || _.isNumber(precision)) {
          labels = new Array(ticks.length);
          if (need_sci) {
            for (i = _j = 0, _ref1 = ticks.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
              labels[i] = ticks[i].toExponential(precision || void 0);
            }
          } else {
            for (i = _k = 0, _ref2 = ticks.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
              labels[i] = ticks[i].toFixed(precision || void 0).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
            }
          }
          return labels;
        } else if (precision === 'auto') {
          labels = new Array(ticks.length);
          for (x = _l = _ref3 = this.last_precision; _ref3 <= 15 ? _l <= 15 : _l >= 15; x = _ref3 <= 15 ? ++_l : --_l) {
            is_ok = true;
            if (need_sci) {
              for (i = _m = 0, _ref4 = ticks.length; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; i = 0 <= _ref4 ? ++_m : --_m) {
                labels[i] = ticks[i].toExponential(x);
                if (i > 0) {
                  if (labels[i] === labels[i - 1]) {
                    is_ok = false;
                    break;
                  }
                }
              }
              if (is_ok) {
                break;
              }
            } else {
              for (i = _n = 0, _ref5 = ticks.length; 0 <= _ref5 ? _n < _ref5 : _n > _ref5; i = 0 <= _ref5 ? ++_n : --_n) {
                labels[i] = ticks[i].toFixed(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
                if (i > 0) {
                  if (labels[i] === labels[i - 1]) {
                    is_ok = false;
                    break;
                  }
                }
              }
              if (is_ok) {
                break;
              }
            }
            if (is_ok) {
              this.last_precision = x;
              return labels;
            }
          }
        }
        return labels;
      };

      BasicTickFormatter.prototype.defaults = function() {
        return _.extend({}, BasicTickFormatter.__super__.defaults.call(this), {
          precision: 'auto',
          use_scientific: true,
          power_limit_high: 5,
          power_limit_low: -3
        });
      };

      return BasicTickFormatter;

    })(HasProperties);
    BasicTickFormatters = (function(_super) {
      __extends(BasicTickFormatters, _super);

      function BasicTickFormatters() {
        _ref1 = BasicTickFormatters.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BasicTickFormatters.prototype.model = BasicTickFormatter;

      return BasicTickFormatters;

    })(Collection);
    return {
      "Model": BasicTickFormatter,
      "Collection": new BasicTickFormatters()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=basic_tick_formatter.js.map
*/