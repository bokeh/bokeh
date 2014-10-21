(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "./axis", "ticking/datetime_ticker", "ticking/datetime_tick_formatter"], function(Collection, Axis, DatetimeTicker, DatetimeTickFormatter) {
    var DatetimeAxes, DatetimeAxis, DatetimeAxisView, _ref, _ref1, _ref2;
    DatetimeAxisView = (function(_super) {
      __extends(DatetimeAxisView, _super);

      function DatetimeAxisView() {
        _ref = DatetimeAxisView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      return DatetimeAxisView;

    })(Axis.View);
    DatetimeAxis = (function(_super) {
      __extends(DatetimeAxis, _super);

      function DatetimeAxis() {
        _ref1 = DatetimeAxis.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DatetimeAxis.prototype.default_view = DatetimeAxisView;

      DatetimeAxis.prototype.type = 'DatetimeAxis';

      DatetimeAxis.prototype.initialize = function(attrs, objects) {
        DatetimeAxis.__super__.initialize.call(this, attrs, objects);
        if (this.get('ticker') == null) {
          this.set_obj('ticker', DatetimeTicker.Collection.create());
        }
        if (this.get('formatter') == null) {
          return this.set_obj('formatter', DatetimeTickFormatter.Collection.create());
        }
      };

      return DatetimeAxis;

    })(Axis.Model);
    DatetimeAxes = (function(_super) {
      __extends(DatetimeAxes, _super);

      function DatetimeAxes() {
        _ref2 = DatetimeAxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DatetimeAxes.prototype.model = DatetimeAxis;

      return DatetimeAxes;

    })(Collection);
    return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=datetime_axis.js.map
*/