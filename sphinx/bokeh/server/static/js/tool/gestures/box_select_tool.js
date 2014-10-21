(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "renderer/overlay/box_selection", "tool/gestures/select_tool"], function(_, Collection, BoxSelection, SelectTool) {
    var BoxSelectTool, BoxSelectToolView, BoxSelectTools, _ref, _ref1, _ref2;
    BoxSelectToolView = (function(_super) {
      __extends(BoxSelectToolView, _super);

      function BoxSelectToolView() {
        _ref = BoxSelectToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BoxSelectToolView.prototype._pan_start = function(e) {
        var canvas;
        canvas = this.plot_view.canvas;
        this._baseboint = [canvas.sx_to_vx(e.bokeh.sx), canvas.sy_to_vy(e.bokeh.sy)];
        return null;
      };

      BoxSelectToolView.prototype._pan = function(e) {
        var canvas, curpoint, dims, frame, vxlim, vylim, _ref1;
        canvas = this.plot_view.canvas;
        curpoint = [canvas.sx_to_vx(e.bokeh.sx), canvas.sy_to_vy(e.bokeh.sy)];
        frame = this.plot_model.get('frame');
        dims = this.mget('dimensions');
        _ref1 = this.model._get_dim_limits(this._baseboint, curpoint, frame, dims), vxlim = _ref1[0], vylim = _ref1[1];
        this.mget('overlay').set('data', {
          vxlim: vxlim,
          vylim: vylim
        });
        if (this.mget('select_every_mousemove')) {
          this._select(vxlim, vylim, false);
        }
        return null;
      };

      BoxSelectToolView.prototype._pan_end = function(e) {
        var canvas, curpoint, dims, frame, vxlim, vylim, _ref1;
        canvas = this.plot_view.canvas;
        curpoint = [canvas.sx_to_vx(e.bokeh.sx), canvas.sy_to_vy(e.bokeh.sy)];
        frame = this.plot_model.get('frame');
        dims = this.mget('dimensions');
        _ref1 = this.model._get_dim_limits(this._baseboint, curpoint, frame, dims), vxlim = _ref1[0], vylim = _ref1[1];
        this._select(vxlim, vylim, true);
        this.mget('overlay').set('data', {});
        this._baseboint = null;
        return null;
      };

      BoxSelectToolView.prototype._select = function(_arg, _arg1, final) {
        var ds, geometry, r, sm, vx0, vx1, vy0, vy1, _i, _len, _ref1;
        vx0 = _arg[0], vx1 = _arg[1];
        vy0 = _arg1[0], vy1 = _arg1[1];
        geometry = {
          type: 'rect',
          vx0: vx0,
          vx1: vx1,
          vy0: vy0,
          vy1: vy1
        };
        _ref1 = this.mget('renderers');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          r = _ref1[_i];
          ds = r.get('data_source');
          sm = ds.get('selection_manager');
          sm.select(this, this.plot_view.renderers[r.id], geometry, final);
        }
        return null;
      };

      return BoxSelectToolView;

    })(SelectTool.View);
    BoxSelectTool = (function(_super) {
      __extends(BoxSelectTool, _super);

      function BoxSelectTool() {
        _ref1 = BoxSelectTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BoxSelectTool.prototype.default_view = BoxSelectToolView;

      BoxSelectTool.prototype.type = "BoxSelectTool";

      BoxSelectTool.prototype.tool_name = "Box Select";

      BoxSelectTool.prototype.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAYAAAB6kdqOAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODVDNDBCRjIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODVDNDBDMDIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkE4NUM0MEJEMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkE4NUM0MEJFMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+hdQ7dQAAAJdJREFUeNpiXLhs5X8GBPgIxAJQNjZxfiD+wIAKGCkUZ0SWZGIYZIAF3YVoPkEHH6kojhUMyhD6jydEaAlgaWnwh9BAgf9DKpfxDxYHjeay0Vw2bHMZw2guG81lwyXKRnMZWlt98JdDTFAX/x9NQwPkIH6kGMAVEyjyo7lstC4jouc69Moh9L42rlyBTZyYXDS00xBAgAEAqsguPe03+cYAAAAASUVORK5CYII=";

      BoxSelectTool.prototype.event_type = "pan";

      BoxSelectTool.prototype.default_order = 30;

      BoxSelectTool.prototype.initialize = function(attrs, options) {
        var plot_renderers;
        BoxSelectTool.__super__.initialize.call(this, attrs, options);
        this.register_property('tooltip', function() {
          return this._get_dim_tooltip(this.get("tool_name"), this._check_dims(this.get('dimensions'), "box select tool"));
        }, false);
        this.add_dependencies('tooltip', this, ['dimensions']);
        this.set('overlay', new BoxSelection.Model);
        plot_renderers = this.get('plot').get('renderers');
        plot_renderers.push(this.get('overlay'));
        return this.get('plot').set('renderers', plot_renderers);
      };

      BoxSelectTool.prototype.defaults = function() {
        return _.extend({}, BoxSelectTool.__super__.defaults.call(this), {
          dimensions: ["width", "height"],
          select_every_mousemove: false
        });
      };

      return BoxSelectTool;

    })(SelectTool.Model);
    BoxSelectTools = (function(_super) {
      __extends(BoxSelectTools, _super);

      function BoxSelectTools() {
        _ref2 = BoxSelectTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      BoxSelectTools.prototype.model = BoxSelectTool;

      return BoxSelectTools;

    })(Collection);
    return {
      "Model": BoxSelectTool,
      "Collection": new BoxSelectTools(),
      "View": BoxSelectToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=box_select_tool.js.map
*/