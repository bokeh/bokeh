(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/logging", "tool/gestures/gesture_tool"], function(_, Collection, Logging, GestureTool) {
    var PanTool, PanToolView, PanTools, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    PanToolView = (function(_super) {
      __extends(PanToolView, _super);

      function PanToolView() {
        _ref = PanToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PanToolView.prototype._pan_start = function(e) {
        this.last_dx = 0;
        return this.last_dy = 0;
      };

      PanToolView.prototype._pan = function(e) {
        return this._update(e.deltaX, -e.deltaY);
      };

      PanToolView.prototype._update = function(dx, dy) {
        var dims, end, frame, hr, mapper, name, new_dx, new_dy, pan_info, sdx, sdy, start, sx0, sx1, sx_high, sx_low, sy0, sy1, sy_high, sy_low, vr, xrs, yrs, _ref1, _ref2, _ref3, _ref4;
        frame = this.plot_view.frame;
        new_dx = dx - this.last_dx;
        new_dy = dy - this.last_dy;
        hr = _.clone(frame.get('h_range'));
        sx_low = hr.get('start') - new_dx;
        sx_high = hr.get('end') - new_dx;
        vr = _.clone(frame.get('v_range'));
        sy_low = vr.get('start') - new_dy;
        sy_high = vr.get('end') - new_dy;
        dims = this.mget('dimensions');
        if (dims.indexOf('width') > -1) {
          sx0 = sx_low;
          sx1 = sx_high;
          sdx = -new_dx;
        } else {
          sx0 = hr.get('start');
          sx1 = hr.get('end');
          sdx = 0;
        }
        if (dims.indexOf('height') > -1) {
          sy0 = sy_low;
          sy1 = sy_high;
          sdy = new_dy;
        } else {
          sy0 = vr.get('start');
          sy1 = vr.get('end');
          sdy = 0;
        }
        this.last_dx = dx;
        this.last_dy = dy;
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
        pan_info = {
          xrs: xrs,
          yrs: yrs,
          sdx: sdx,
          sdy: sdy
        };
        this.plot_view.update_range(pan_info);
        return null;
      };

      return PanToolView;

    })(GestureTool.View);
    PanTool = (function(_super) {
      __extends(PanTool, _super);

      function PanTool() {
        _ref1 = PanTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PanTool.prototype.default_view = PanToolView;

      PanTool.prototype.type = "PanTool";

      PanTool.prototype.tool_name = "Pan";

      PanTool.prototype.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCRTI5MDhEODIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCRTI5MDhEOTIwQjUxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkJFMjkwOEQ2MjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFMjkwOEQ3MjBCNTExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+OXzPwwAAAKNJREFUeNrsVsEKgCAM3cyj0f8fuwT9XdEHrLyVIOKYY4kPPDim0+fenF+3HZi4nhFec+Rs4oCPAALwjDVUsKMWA6DNAFX6YXcMYIERdRWIYBzAZbKYGsSKex6mVUAK8Za0TphgoFTbpSvlx3/I0EQOILO2i/ibegLk/mgVONM4JvuBVizgkGH3XTGrR/xlV0ycbO8qCeMN54wdtVQwSTFwCzAATqEZUn8W8W4AAAAASUVORK5CYII=";

      PanTool.prototype.event_type = "pan";

      PanTool.prototype.default_order = 10;

      PanTool.prototype.initialize = function(attrs, options) {
        PanTool.__super__.initialize.call(this, attrs, options);
        this.register_property('tooltip', function() {
          return this._get_dim_tooltip("Pan", this._check_dims(this.get('dimensions'), "pan tool"));
        }, false);
        return this.add_dependencies('tooltip', this, ['dimensions']);
      };

      PanTool.prototype.defaults = function() {
        return _.extend({}, PanTool.__super__.defaults.call(this), {
          dimensions: ["width", "height"]
        });
      };

      return PanTool;

    })(GestureTool.Model);
    PanTools = (function(_super) {
      __extends(PanTools, _super);

      function PanTools() {
        _ref2 = PanTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PanTools.prototype.model = PanTool;

      return PanTools;

    })(Collection);
    return {
      "Model": PanTool,
      "Collection": new PanTools(),
      "View": PanToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=pan_tool.js.map
*/