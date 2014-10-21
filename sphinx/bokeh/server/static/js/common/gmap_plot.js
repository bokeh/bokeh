(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./collection", "./solver", "./plot"], function(_, Collection, Solver, Plot) {
    var GMapPlot, GMapPlotView, GMapPlots, _ref, _ref1, _ref2;
    GMapPlotView = (function(_super) {
      __extends(GMapPlotView, _super);

      function GMapPlotView() {
        this.bounds_change = __bind(this.bounds_change, this);
        _ref = GMapPlotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GMapPlotView.prototype.initialize = function(options) {
        GMapPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
        return this.zoom_count = null;
      };

      GMapPlotView.prototype.update_range = function(range_info) {
        var center, ne_lat, ne_lng, sw_lat, sw_lng, xr, yr;
        if (range_info == null) {
          range_info = this.initial_range_info;
        }
        this.pause();
        if (range_info.sdx != null) {
          this.map.panBy(range_info.sdx, range_info.sdy);
        } else {
          xr = range_info.xrs["default"];
          yr = range_info.yrs["default"];
          sw_lng = Math.min(xr.start, xr.end);
          ne_lng = Math.max(xr.start, xr.end);
          sw_lat = Math.min(yr.start, yr.end);
          ne_lat = Math.max(yr.start, yr.end);
          center = new google.maps.LatLng((ne_lat + sw_lat) / 2, (ne_lng + sw_lng) / 2);
          if (range_info.factor == null) {
            this.map.setCenter(center);
            this.map.setZoom(this.initial_zoom);
          } else if (range_info.factor > 0) {
            this.zoom_count += 1;
            if (this.zoom_count === 10) {
              this.map.setZoom(this.map.getZoom() + 1);
              this.zoom_count = 0;
            }
          } else {
            this.zoom_count -= 1;
            if (this.zoom_count === -10) {
              this.map.setCenter(center);
              this.map.setZoom(this.map.getZoom() - 1);
              this.map.setCenter(center);
              this.zoom_count = 0;
            }
          }
        }
        return this.unpause();
      };

      GMapPlotView.prototype.bind_bokeh_events = function() {
        var build_map, height, left, script, top, width,
          _this = this;
        GMapPlotView.__super__.bind_bokeh_events.call(this);
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
          var map_options, map_types, mo;
          map_types = {
            "satellite": google.maps.MapTypeId.SATELLITE,
            "terrain": google.maps.MapTypeId.TERRAIN,
            "roadmap": google.maps.MapTypeId.ROADMAP,
            "hybrid": google.maps.MapTypeId.HYBRID
          };
          mo = _this.mget('map_options');
          map_options = {
            center: new google.maps.LatLng(mo.lat, mo.lng),
            zoom: mo.zoom,
            disableDefaultUI: true,
            mapTypeId: map_types[mo.map_type]
          };
          _this.map = new google.maps.Map(_this.canvas_view.map_div[0], map_options);
          return google.maps.event.addListener(_this.map, 'bounds_changed', _this.bounds_change);
        };
        if ((window.google != null) && (window.google.maps != null)) {
          return _.defer(build_map);
        } else {
          window['_bokeh_first_gmap_load'] = build_map;
          script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=_bokeh_first_gmap_load';
          return document.body.appendChild(script);
        }
      };

      GMapPlotView.prototype.bounds_change = function() {
        var bds, ne, sw;
        bds = this.map.getBounds();
        ne = bds.getNorthEast();
        sw = bds.getSouthWest();
        this.x_range.set({
          start: sw.lng(),
          end: ne.lng(),
          silent: true
        });
        this.y_range.set({
          start: sw.lat(),
          end: ne.lat(),
          silent: true
        });
        if (this.initial_range_info == null) {
          this.initial_range_info = {
            xr: {
              start: this.x_range.get('start'),
              end: this.x_range.get('end')
            },
            yr: {
              start: this.y_range.get('start'),
              end: this.y_range.get('end')
            }
          };
        }
        return this.render();
      };

      GMapPlotView.prototype._map_hook = function(ctx, frame_box) {
        var height, left, top, width;
        left = frame_box[0], top = frame_box[1], width = frame_box[2], height = frame_box[3];
        this.canvas_view.map_div.attr("style", "top: " + top + "px; left: " + left + "px;");
        return this.canvas_view.map_div.width("" + width + "px").height("" + width + "px");
      };

      GMapPlotView.prototype._paint_empty = function(ctx, frame_box) {
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

      return GMapPlotView;

    })(Plot.View);
    GMapPlot = (function(_super) {
      __extends(GMapPlot, _super);

      function GMapPlot() {
        _ref1 = GMapPlot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      GMapPlot.prototype.type = 'GMapPlot';

      GMapPlot.prototype.default_view = GMapPlotView;

      GMapPlot.prototype.initialize = function(attrs, options) {
        this.use_map = true;
        return GMapPlot.__super__.initialize.call(this, attrs, options);
      };

      GMapPlot.prototype.parent_properties = ['border_fill', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

      GMapPlot.prototype.defaults = function() {
        return _.extend({}, GMapPlot.__super__.defaults.call(this), {
          title: 'GMapPlot'
        });
      };

      GMapPlot.prototype.display_defaults = function() {
        return _.extend({}, GMapPlot.__super__.display_defaults.call(this), {
          border_fill: "#eee"
        });
      };

      return GMapPlot;

    })(Plot.Model);
    GMapPlots = (function(_super) {
      __extends(GMapPlots, _super);

      function GMapPlots() {
        _ref2 = GMapPlots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      GMapPlots.prototype.model = GMapPlot;

      return GMapPlots;

    })(Collection);
    return {
      "Model": GMapPlot,
      "Collection": new GMapPlots(),
      "View": GMapPlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=gmap_plot.js.map
*/