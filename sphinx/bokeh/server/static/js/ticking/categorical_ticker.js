(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "common/has_properties"], function(Collection, HasProperties) {
    var CategoricalTicker, CategoricalTickers, _ref, _ref1;
    CategoricalTicker = (function(_super) {
      __extends(CategoricalTicker, _super);

      function CategoricalTicker() {
        _ref = CategoricalTicker.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CategoricalTicker.prototype.type = 'CategoricalTicker';

      CategoricalTicker.prototype.get_ticks = function(start, end, range, _arg) {
        var desired_n_ticks;
        desired_n_ticks = _arg.desired_n_ticks;
        return {
          "major": range.get("factors"),
          "minor": []
        };
      };

      return CategoricalTicker;

    })(HasProperties);
    CategoricalTickers = (function(_super) {
      __extends(CategoricalTickers, _super);

      function CategoricalTickers() {
        _ref1 = CategoricalTickers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CategoricalTickers.prototype.model = CategoricalTicker;

      return CategoricalTickers;

    })(Collection);
    return {
      "Model": CategoricalTicker,
      "Collection": new CategoricalTickers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=categorical_ticker.js.map
*/