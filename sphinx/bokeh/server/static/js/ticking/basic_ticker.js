(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "ticking/adaptive_ticker"], function(Collection, AdaptiveTicker) {
    var BasicTicker, BasicTickers, _ref, _ref1;
    BasicTicker = (function(_super) {
      __extends(BasicTicker, _super);

      function BasicTicker() {
        _ref = BasicTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BasicTicker.prototype.type = 'BasicTicker';

      BasicTicker.prototype.initialize = function(attrs, options) {
        return BasicTicker.__super__.initialize.call(this, attrs, options);
      };

      BasicTicker.prototype.defaults = function() {
        return _.extend({}, BasicTicker.__super__.defaults.call(this), {
          mantissas: [1, 2, 5]
        });
      };

      return BasicTicker;

    })(AdaptiveTicker.Model);
    BasicTickers = (function(_super) {
      __extends(BasicTickers, _super);

      function BasicTickers() {
        _ref1 = BasicTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BasicTickers.prototype.model = BasicTicker;

      return BasicTickers;

    })(Collection);
    return {
      "Model": BasicTicker,
      "Collection": new BasicTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=basic_ticker.js.map
*/