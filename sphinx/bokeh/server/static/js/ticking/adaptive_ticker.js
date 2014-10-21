(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "ticking/abstract_ticker", "ticking/util"], function(_, Collection, AbstractTicker, util) {
    var AdaptiveTicker, AdaptiveTickers, argmin, clamp, log, _ref, _ref1;
    argmin = util.argmin;
    clamp = function(x, min_val, max_val) {
      return Math.max(min_val, Math.min(max_val, x));
    };
    log = function(x, base) {
      if (base == null) {
        base = Math.E;
      }
      return Math.log(x) / Math.log(base);
    };
    AdaptiveTicker = (function(_super) {
      __extends(AdaptiveTicker, _super);

      function AdaptiveTicker() {
        _ref = AdaptiveTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AdaptiveTicker.prototype.type = 'AdaptiveTicker';

      AdaptiveTicker.prototype.initialize = function(attrs, options) {
        var prefix_mantissa, suffix_mantissa;
        AdaptiveTicker.__super__.initialize.call(this, attrs, options);
        prefix_mantissa = _.last(this.get('mantissas')) / this.get('base');
        suffix_mantissa = _.first(this.get('mantissas')) * this.get('base');
        this.extended_mantissas = _.flatten([prefix_mantissa, this.get('mantissas'), suffix_mantissa]);
        return this.base_factor = this.get('min_interval') === 0.0 ? 1.0 : this.get('min_interval');
      };

      AdaptiveTicker.prototype.get_interval = function(data_low, data_high, desired_n_ticks) {
        var best_mantissa, candidate_mantissas, data_range, errors, ideal_interval, ideal_magnitude, ideal_mantissa, interval, interval_exponent;
        data_range = data_high - data_low;
        ideal_interval = this.get_ideal_interval(data_low, data_high, desired_n_ticks);
        interval_exponent = Math.floor(log(ideal_interval / this.base_factor, this.get('base')));
        ideal_magnitude = Math.pow(this.get('base'), interval_exponent) * this.base_factor;
        ideal_mantissa = ideal_interval / ideal_magnitude;
        candidate_mantissas = this.extended_mantissas;
        errors = candidate_mantissas.map(function(mantissa) {
          return Math.abs(desired_n_ticks - (data_range / (mantissa * ideal_magnitude)));
        });
        best_mantissa = candidate_mantissas[argmin(errors)];
        interval = best_mantissa * ideal_magnitude;
        return clamp(interval, this.get('min_interval'), this.get('max_interval'));
      };

      AdaptiveTicker.prototype.defaults = function() {
        return _.extend({}, AdaptiveTicker.__super__.defaults.call(this), {
          toString_properties: ['mantissas', 'base', 'min_magnitude', 'max_magnitude'],
          base: 10.0,
          mantissas: [2, 5, 10],
          min_interval: 0.0,
          max_interval: Infinity
        });
      };

      return AdaptiveTicker;

    })(AbstractTicker.Model);
    AdaptiveTickers = (function(_super) {
      __extends(AdaptiveTickers, _super);

      function AdaptiveTickers() {
        _ref1 = AdaptiveTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      AdaptiveTickers.prototype.model = AdaptiveTicker;

      return AdaptiveTickers;

    })(Collection);
    return {
      "Model": AdaptiveTicker,
      "Collection": new AdaptiveTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=adaptive_ticker.js.map
*/