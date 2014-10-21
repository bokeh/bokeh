(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "common/has_properties"], function(Collection, HasProperties) {
    var CategoricalTickFormatter, CategoricalTickFormatters, _ref, _ref1;
    CategoricalTickFormatter = (function(_super) {
      __extends(CategoricalTickFormatter, _super);

      function CategoricalTickFormatter() {
        _ref = CategoricalTickFormatter.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CategoricalTickFormatter.prototype.type = 'CategoricalTickFormatter';

      CategoricalTickFormatter.prototype.initialize = function(attrs, options) {
        return CategoricalTickFormatter.__super__.initialize.call(this, attrs, options);
      };

      CategoricalTickFormatter.prototype.format = function(ticks) {
        return ticks;
      };

      return CategoricalTickFormatter;

    })(HasProperties);
    CategoricalTickFormatters = (function(_super) {
      __extends(CategoricalTickFormatters, _super);

      function CategoricalTickFormatters() {
        _ref1 = CategoricalTickFormatters.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CategoricalTickFormatters.prototype.model = CategoricalTickFormatter;

      return CategoricalTickFormatters;

    })(Collection);
    return {
      "Model": CategoricalTickFormatter,
      "Collection": new CategoricalTickFormatters()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=categorical_tick_formatter.js.map
*/