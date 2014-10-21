(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "ticking/abstract_ticker"], function(_, Collection, AbstractTicker) {
    var SingleIntervalTicker, SingleIntervalTickers, _ref, _ref1;
    SingleIntervalTicker = (function(_super) {
      __extends(SingleIntervalTicker, _super);

      function SingleIntervalTicker() {
        _ref = SingleIntervalTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SingleIntervalTicker.prototype.type = 'SingleIntervalTicker';

      SingleIntervalTicker.prototype.initialize = function(attrs, options) {
        SingleIntervalTicker.__super__.initialize.call(this, attrs, options);
        this.register_property('min_interval', function() {
          return this.get('interval');
        }, true);
        this.add_dependencies('min_interval', this, ['interval']);
        this.register_property('max_interval', function() {
          return this.get('interval');
        }, true);
        return this.add_dependencies('max_interval', this, ['interval']);
      };

      SingleIntervalTicker.prototype.get_interval = function(data_low, data_high, n_desired_ticks) {
        return this.get('interval');
      };

      SingleIntervalTicker.prototype.defaults = function() {
        return _.extend({}, SingleIntervalTicker.__super__.defaults.call(this), {
          toString_properties: ['interval']
        });
      };

      return SingleIntervalTicker;

    })(AbstractTicker.Model);
    SingleIntervalTickers = (function(_super) {
      __extends(SingleIntervalTickers, _super);

      function SingleIntervalTickers() {
        _ref1 = SingleIntervalTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      SingleIntervalTickers.prototype.model = SingleIntervalTicker;

      return SingleIntervalTickers;

    })(Collection);
    return {
      "Model": SingleIntervalTicker,
      "Collection": new SingleIntervalTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=single_interval_ticker.js.map
*/