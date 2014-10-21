(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["./continuum_view"], function(ContinuumView) {
    var PlotWidget, _ref;
    return PlotWidget = (function(_super) {
      __extends(PlotWidget, _super);

      function PlotWidget() {
        _ref = PlotWidget.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PlotWidget.prototype.tagName = 'div';

      PlotWidget.prototype.initialize = function(options) {
        this.plot_model = options.plot_model;
        return this.plot_view = options.plot_view;
      };

      PlotWidget.prototype.bind_bokeh_events = function() {};

      PlotWidget.prototype.request_render = function() {
        return this.plot_view.request_render();
      };

      return PlotWidget;

    })(ContinuumView);
  });

}).call(this);

/*
//@ sourceMappingURL=plot_widget.js.map
*/