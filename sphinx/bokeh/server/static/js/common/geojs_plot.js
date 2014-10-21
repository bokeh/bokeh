(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./collection", "./solver", "./plot"], function(_, Collection, Solver, Plot) {
    var GeoJSPlot, GeoJSPlotView, GeoJSPlots, _ref, _ref1, _ref2;
    GeoJSPlotView = (function(_super) {
      __extends(GeoJSPlotView, _super);

      function GeoJSPlotView() {
        _ref = GeoJSPlotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GeoJSPlotView.prototype.initialize = function(options) {
        GeoJSPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
        return this.zoom_count = null;
      };

      GeoJSPlotView.prototype.bind_bokeh_events = function() {
        var build_map, height, left, top, width,
          _this = this;
        GeoJSPlotView.__super__.bind_bokeh_events.call(this);
        width = this.frame.get('width');
        height = this.frame.get('height');
        left = this.canvas.vx_to_sx(this.frame.get('left'));
        top = this.canvas.vy_to_sy(this.frame.get('top'));
        this.canvas_view.map_div.attr("style", "top: " + top + "px; left: " + left + "px; position: absolute");
        this.canvas_view.map_div.attr('style', "width:" + width + "px;");
        this.canvas_view.map_div.attr('style', "height:" + height + "px;");
        this.canvas_view.map_div.width("" + width + "px").height("" + height + "px");
        this.initial_zoom = this.mget('map_options').zoom;
        build_map = function() {
          var map_options, mo;
          mo = _this.mget('map_options');
          map_options = {
            center: [mo.lat, mo.lng],
            zoom: mo.zoom,
            node: _this.canvas_view.map_div[0]
          };
          _this.map = geo.map(map_options);
          return _this.map.createLayer('osm');
        };
        return $.getScript("http://opengeoscience.github.io/geojs/lib/gl-matrix.js", function() {
          return $.getScript("http://opengeoscience.github.io/geojs/lib/d3.v3.min.js", function() {
            return $.getScript("http://opengeoscience.github.io/geojs/lib/proj4.js", function() {
              return $.getScript("http://opengeoscience.github.io/geojs/lib/vgl.js", function() {
                return $.getScript("http://opengeoscience.github.io/geojs/lib/geo.js", function() {
                  return build_map();
                });
              });
            });
          });
        });
      };

      GeoJSPlotView.prototype._map_hook = function(ctx, frame_box) {
        var height, left, top, width;
        left = frame_box[0], top = frame_box[1], width = frame_box[2], height = frame_box[3];
        this.canvas_view.map_div.attr("style", "top: " + top + "px; left: " + left + "px;");
        return this.canvas_view.map_div.width("" + width + "px").height("" + width + "px");
      };

      GeoJSPlotView.prototype._paint_empty = function(ctx, frame_box) {
        var ih, iw, left, oh, ow, top;
        ow = this.canvas.get('width');
        oh = this.canvas.get('height');
        left = frame_box[0], top = frame_box[1], iw = frame_box[2], ih = frame_box[3];
        ctx.clearRect(0, 0, ow, oh);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, oh);
        ctx.lineTo(ow, oh);
        ctx.lineTo(ow, 0);
        ctx.lineTo(0, 0);
        ctx.moveTo(left, top);
        ctx.lineTo(left + iw, top);
        ctx.lineTo(left + iw, top + ih);
        ctx.lineTo(left, top + ih);
        ctx.lineTo(left, top);
        ctx.closePath();
        ctx.fillStyle = this.mget('border_fill');
        return ctx.fill();
      };

      return GeoJSPlotView;

    })(Plot.View);
    GeoJSPlot = (function(_super) {
      __extends(GeoJSPlot, _super);

      function GeoJSPlot() {
        _ref1 = GeoJSPlot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      GeoJSPlot.prototype.type = 'GeoJSPlot';

      GeoJSPlot.prototype.default_view = GeoJSPlotView;

      GeoJSPlot.prototype.initialize = function(attrs, options) {
        this.use_map = true;
        return GeoJSPlot.__super__.initialize.call(this, attrs, options);
      };

      GeoJSPlot.prototype.parent_properties = ['border_fill', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

      GeoJSPlot.prototype.defaults = function() {
        return _.extend({}, GeoJSPlot.__super__.defaults.call(this), {
          title: 'GeoJSPlot'
        });
      };

      GeoJSPlot.prototype.display_defaults = function() {
        return _.extend({}, GeoJSPlot.__super__.display_defaults.call(this), {
          border_fill: "#eee"
        });
      };

      return GeoJSPlot;

    })(Plot.Model);
    GeoJSPlots = (function(_super) {
      __extends(GeoJSPlots, _super);

      function GeoJSPlots() {
        _ref2 = GeoJSPlots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      GeoJSPlots.prototype.model = GeoJSPlot;

      return GeoJSPlots;

    })(Collection);
    return {
      "Model": GeoJSPlot,
      "Collection": new GeoJSPlots(),
      "View": GeoJSPlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=geojs_plot.js.map
*/