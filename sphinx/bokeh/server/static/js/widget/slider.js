(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/collection", "underscore", "common/continuum_view", "common/has_parent", "common/logging", "./slidertemplate", "jquery_ui/slider"], function(Collection, _, ContinuumView, HasParent, Logging, slidertemplate) {
    var Slider, SliderView, Sliders, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    SliderView = (function(_super) {
      __extends(SliderView, _super);

      function SliderView() {
        this.slide = __bind(this.slide, this);
        _ref = SliderView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SliderView.prototype.tagName = "div";

      SliderView.prototype.template = slidertemplate;

      SliderView.prototype.initialize = function(options) {
        SliderView.__super__.initialize.call(this, options);
        return this.render();
      };

      SliderView.prototype.render = function() {
        var html, max, min, step;
        this.$el.empty();
        html = this.template(this.model.attributes);
        this.$el.html(html);
        max = this.mget('end');
        min = this.mget('start');
        step = this.mget('step') || ((max - min) / 50);
        logger.debug("slider render: min, max, step = (" + min + ", " + max + ", " + step + ")");
        this.$('.slider').slider({
          orientation: this.mget('orientation'),
          animate: "fast",
          slide: _.throttle(this.slide, 200),
          value: this.mget('value'),
          min: min,
          max: max,
          step: step
        });
        return this.$("#" + (this.mget('id'))).val(this.$('.slider').slider('value'));
      };

      SliderView.prototype.slide = function(event, ui) {
        var value;
        value = ui.value;
        logger.debug("slide value = " + value);
        this.$("#" + (this.mget('id'))).val(ui.value);
        this.mset('value', value);
        return this.model.save();
      };

      return SliderView;

    })(ContinuumView);
    Slider = (function(_super) {
      __extends(Slider, _super);

      function Slider() {
        _ref1 = Slider.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Slider.prototype.type = "Slider";

      Slider.prototype.default_view = SliderView;

      Slider.prototype.defaults = function() {
        return _.extend({}, Slider.__super__.defaults.call(this), {
          title: '',
          value: 0.5,
          start: 0,
          end: 1,
          step: 0,
          orientation: "horizontal"
        });
      };

      return Slider;

    })(HasParent);
    Sliders = (function(_super) {
      __extends(Sliders, _super);

      function Sliders() {
        _ref2 = Sliders.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Sliders.prototype.model = Slider;

      return Sliders;

    })(Collection);
    return {
      Model: Slider,
      Collection: new Sliders(),
      View: SliderView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=slider.js.map
*/