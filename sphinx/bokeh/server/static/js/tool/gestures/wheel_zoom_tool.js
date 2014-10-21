(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/logging", "tool/gestures/gesture_tool"], function(_, Collection, Logging, GestureTool) {
    var WheelZoomTool, WheelZoomToolView, WheelZoomTools, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    WheelZoomToolView = (function(_super) {
      __extends(WheelZoomToolView, _super);

      function WheelZoomToolView() {
        _ref = WheelZoomToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      WheelZoomToolView.prototype._scroll = function(e) {
        var delta, dims, end, factor, frame, hr, mapper, multiplier, name, start, sx0, sx1, sy0, sy1, vr, vx, vx_high, vx_low, vy, vy_high, vy_low, xrs, yrs, zoom_info, _ref1, _ref2, _ref3, _ref4;
        frame = this.plot_model.get('frame');
        hr = frame.get('h_range');
        vr = frame.get('v_range');
        vx = this.plot_view.canvas.sx_to_vx(e.bokeh.sx);
        vy = this.plot_view.canvas.sy_to_vy(e.bokeh.sy);
        if (!(vx >= hr.get('start') && vx <= hr.get('end') && vy >= vr.get('start') && vy <= vr.get('end'))) {
          return null;
        }
        if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
          multiplier = 20;
        } else {
          multiplier = 1;
        }
        if (e.originalEvent.deltaY != null) {
          delta = -e.originalEvent.deltaY * multiplier;
        } else {
          delta = e.bokeh.delta;
        }
        factor = this.mget('speed') * delta;
        if (factor > 0.9) {
          factor = 0.9;
        } else if (factor < -0.9) {
          factor = -0.9;
        }
        vx_low = hr.get('start');
        vx_high = hr.get('end');
        vy_low = vr.get('start');
        vy_high = vr.get('end');
        dims = this.mget('dimensions');
        if (dims.indexOf('width') > -1) {
          sx0 = vx_low - (vx_low - vx) * factor;
          sx1 = vx_high - (vx_high - vx) * factor;
        } else {
          sx0 = vx_low;
          sx1 = vx_high;
        }
        if (dims.indexOf('height') > -1) {
          sy0 = vy_low - (vy_low - vy) * factor;
          sy1 = vy_high - (vy_high - vy) * factor;
        } else {
          sy0 = vy_low;
          sy1 = vy_high;
        }
        xrs = {};
        _ref1 = frame.get('x_mappers');
        for (name in _ref1) {
          mapper = _ref1[name];
          _ref2 = mapper.v_map_from_target([sx0, sx1]), start = _ref2[0], end = _ref2[1];
          xrs[name] = {
            start: start,
            end: end
          };
        }
        yrs = {};
        _ref3 = frame.get('y_mappers');
        for (name in _ref3) {
          mapper = _ref3[name];
          _ref4 = mapper.v_map_from_target([sy0, sy1]), start = _ref4[0], end = _ref4[1];
          yrs[name] = {
            start: start,
            end: end
          };
        }
        zoom_info = {
          xrs: xrs,
          yrs: yrs,
          factor: factor
        };
        this.plot_view.update_range(zoom_info);
        return null;
      };

      return WheelZoomToolView;

    })(GestureTool.View);
    WheelZoomTool = (function(_super) {
      __extends(WheelZoomTool, _super);

      function WheelZoomTool() {
        _ref1 = WheelZoomTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      WheelZoomTool.prototype.default_view = WheelZoomToolView;

      WheelZoomTool.prototype.type = "WheelZoomTool";

      WheelZoomTool.prototype.tool_name = "Wheel Zoom";

      WheelZoomTool.prototype.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAgCAYAAABpRpp6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCRTI5MDhEQzIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCRTI5MDhERDIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkJFMjkwOERBMjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFMjkwOERCMjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+sFLapAAAA8xJREFUeNq8WH9k1VEU/+67ecTYxKM8xlJiifKIMUqUKMvy1CqbEmUxJZbSlGXTLBuJpYi18dpqStOzacT+WcTXpkiRUjziETEeY9bnzHm5O53vj/te7fDx3r3fc+/9fM/3nHPPvWWP0mOOIlVAC3AQqOc2SRZ4A9Cg58CSNrj1+FEnSIYfPynHTyOQArYCO/jRPPAJGAcmMM9f87vKfG3AF+AucMAgS5LgRZ4CH/mFrARkieAs8Aw4ASSBckaS++jZLOv6El4HjAKDwPoIa28GXgLdFmQv4WcO2BVBnXTmeIxK+D5wzLGXa8D1CGT78NPPhjFlGnjAmBbPSLefx65IBf+eZZ81hfznIfsr+W0eaACa2G3MhbuAt8CUD1kyRIfongDa4affhW4Nu2Oj0d2Bfg+6Y2UIukr2x4ShkAMOMQlNyLcmgVqj7z2wk17UDDosFOOYMOdPQ+dkyBcZFkb8DGxz2ckTwrKHA8g6HMn7gQWjbzsHqZSUmJ8sej6Cq7WzrhkzKVeYnmSEXSBM6I17RZ+WNWRfJ6z7K2xy1umUc7lGDizIkDL+AsNRXs6U3YpOUrRfWwS01K2noIuLzg+iTcFSiFLKlQPi8+aNAIwri24QlstaEM6JdoIsHBOdiyJl9RntfiXazUljEdJb3IKw1F10Q/Krtin0KaSD5Ido77MYK10sG0S4ByjzwW2LRT3pYlxLRBFpGM91/r9kRJuC/FbEnVEmhEwQYRqw7IMuC8LjnAKllSeBhEI0Qc8U636luWinWxYPqoFCnuxmX16VR9ldCvINqOH/NK5alpe8NY8qL5Nnl/GMFJhU6g2SZtqaw1xCkrss2pGEFhLp0CxuGow83+BDdoDn+FP8hJFeYusNlODL9LI/ubKLRRxDKfamuaNWRBx4o9TI49NDD9yjSdn9NKFa5jTGrdrIKpw1FJCtU8h6Rp/HwbVyBNOOSGtKGHJKtGdAao/NBO4aWrecS9mwQiuU8KLoi1nOEfepQ6TsFXVxnnO0NWFZEdVZjK8RaSgXoHtGbihwh4ViCM+LvhaL8VJ3xscdqnwOCk4xhDNKYNRHPOZfCakbzGOS+SWyloX8KsIj4lNScLwIuTsgsq+ASnFkmor4JdJayopKeEHZGOJ8OzMoatIkF0XvxIm5cGhcUtyhVqlrh4rNNoU8fI+jOCUs3cYIk14L63py9yo2D7fyBZ+t3AGuWgTmiFOCuCIvHuHFo6QbCpxm4GLIxZ+880j/K8Lm593EVZqnXF9N8UXIFt7zgwoeunDZCJzju44M+nKlEP4twAAD1RclkNDukAAAAABJRU5ErkJggg==";

      WheelZoomTool.prototype.event_type = "scroll";

      WheelZoomTool.prototype.default_order = 10;

      WheelZoomTool.prototype.initialize = function(attrs, options) {
        WheelZoomTool.__super__.initialize.call(this, attrs, options);
        this.register_property('tooltip', function() {
          return this._get_dim_tooltip(this.get("tool_name"), this._check_dims(this.get('dimensions'), "wheel zoom tool"));
        }, false);
        return this.add_dependencies('tooltip', this, ['dimensions']);
      };

      WheelZoomTool.prototype.defaults = function() {
        return _.extend({}, WheelZoomTool.__super__.defaults.call(this), {
          dimensions: ["width", "height"],
          speed: 1 / 600
        });
      };

      return WheelZoomTool;

    })(GestureTool.Model);
    WheelZoomTools = (function(_super) {
      __extends(WheelZoomTools, _super);

      function WheelZoomTools() {
        _ref2 = WheelZoomTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      WheelZoomTools.prototype.model = WheelZoomTool;

      return WheelZoomTools;

    })(Collection);
    return {
      "Model": WheelZoomTool,
      "Collection": new WheelZoomTools(),
      "View": WheelZoomToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=wheel_zoom_tool.js.map
*/