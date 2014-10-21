(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "./axis", "ticking/basic_ticker", "ticking/basic_tick_formatter"], function(_, Collection, Axis, BasicTicker, BasicTickFormatter) {
    var LinearAxes, LinearAxis, LinearAxisView, _ref, _ref1, _ref2;
    LinearAxisView = (function(_super) {
      __extends(LinearAxisView, _super);

      function LinearAxisView() {
        _ref = LinearAxisView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      return LinearAxisView;

    })(Axis.View);
    LinearAxis = (function(_super) {
      __extends(LinearAxis, _super);

      function LinearAxis() {
        _ref1 = LinearAxis.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LinearAxis.prototype.default_view = LinearAxisView;

      LinearAxis.prototype.type = 'LinearAxis';

      LinearAxis.prototype.initialize = function(attrs, objects) {
        LinearAxis.__super__.initialize.call(this, attrs, objects);
        if (this.get('ticker') == null) {
          this.set_obj('ticker', BasicTicker.Collection.create());
        }
        if (this.get('formatter') == null) {
          return this.set_obj('formatter', BasicTickFormatter.Collection.create());
        }
      };

      return LinearAxis;

    })(Axis.Model);
    LinearAxes = (function(_super) {
      __extends(LinearAxes, _super);

      function LinearAxes() {
        _ref2 = LinearAxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      LinearAxes.prototype.model = LinearAxis;

      return LinearAxes;

    })(Collection);
    return {
      "Model": LinearAxis,
      "Collection": new LinearAxes(),
      "View": LinearAxisView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=linear_axis.js.map
*/