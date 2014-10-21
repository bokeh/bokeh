(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "jquery", "jqrangeslider", "common/collection", "common/continuum_view", "common/has_properties"], function(_, $, $1, Collection, ContinuumView, HasProperties) {
    var DateRangeSlider, DateRangeSliderView, DateRangeSliders, _ref, _ref1, _ref2;
    DateRangeSliderView = (function(_super) {
      __extends(DateRangeSliderView, _super);

      function DateRangeSliderView() {
        _ref = DateRangeSliderView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DateRangeSliderView.prototype.initialize = function(options) {
        var _this = this;
        DateRangeSliderView.__super__.initialize.call(this, options);
        this.render();
        return this.listenTo(this.model, 'change', function() {
          return _this.render;
        });
      };

      DateRangeSliderView.prototype.render = function() {
        var bounds_max, bounds_min, range_max, range_min, value_max, value_min, _ref1, _ref2, _ref3,
          _this = this;
        this.$el.empty();
        _ref1 = this.mget("value"), value_min = _ref1[0], value_max = _ref1[1];
        _ref2 = this.mget("range"), range_min = _ref2[0], range_max = _ref2[1];
        _ref3 = this.mget("bounds"), bounds_min = _ref3[0], bounds_max = _ref3[1];
        this.$el.dateRangeSlider({
          defaultValues: {
            min: new Date(value_min),
            max: new Date(value_max)
          },
          bounds: {
            min: new Date(bounds_min),
            max: new Date(bounds_max)
          },
          range: {
            min: _.isObject(range_min) ? range_min : false,
            max: _.isObject(range_max) ? range_max : false
          },
          step: this.mget("step") || {},
          enabled: this.mget("enabled"),
          arrows: this.mget("arrows"),
          valueLabels: this.mget("value_labels"),
          wheelMode: this.mget("wheel_mode")
        });
        return this.$el.on("userValuesChanged", function(event, data) {
          _this.mset('value', [data.values.min, data.values.max]);
          return _this.model.save();
        });
      };

      return DateRangeSliderView;

    })(ContinuumView);
    DateRangeSlider = (function(_super) {
      __extends(DateRangeSlider, _super);

      function DateRangeSlider() {
        _ref1 = DateRangeSlider.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DateRangeSlider.prototype.type = "DateRangeSlider";

      DateRangeSlider.prototype.default_view = DateRangeSliderView;

      DateRangeSlider.prototype.defaults = function() {
        return _.extend({}, DateRangeSlider.__super__.defaults.call(this), {
          /*
          value
          range
          bounds
          step
          formatter
          scales
          enabled
          arrows
          value_labels
          wheel_mode
          */

        });
      };

      return DateRangeSlider;

    })(HasProperties);
    DateRangeSliders = (function(_super) {
      __extends(DateRangeSliders, _super);

      function DateRangeSliders() {
        _ref2 = DateRangeSliders.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DateRangeSliders.prototype.model = DateRangeSlider;

      return DateRangeSliders;

    })(Collection);
    return {
      Model: DateRangeSlider,
      Collection: new DateRangeSliders(),
      View: DateRangeSliderView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=date_range_slider.js.map
*/