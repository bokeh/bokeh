(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "tool/gestures/gesture_tool"], function(_, Collection, GestureTool) {
    var ResizeTool, ResizeToolView, ResizeTools, _ref, _ref1, _ref2;
    ResizeToolView = (function(_super) {
      __extends(ResizeToolView, _super);

      function ResizeToolView() {
        _ref = ResizeToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ResizeToolView.prototype.className = "bk-resize-popup pull-right";

      ResizeToolView.prototype.initialize = function(options) {
        var wrapper;
        ResizeToolView.__super__.initialize.call(this, options);
        wrapper = this.plot_view.$el.find('div.bk-canvas-wrapper');
        this.$el.appendTo(wrapper);
        this.$el.hide();
        return null;
      };

      ResizeToolView.prototype.activate = function() {
        this.$el.show();
        return null;
      };

      ResizeToolView.prototype.deactivate = function() {
        this.$el.hide();
        return null;
      };

      ResizeToolView.prototype._pan_start = function(e) {
        var canvas;
        canvas = this.plot_view.canvas;
        this.ch = canvas.get('height');
        this.cw = canvas.get('width');
        return null;
      };

      ResizeToolView.prototype._pan = function(e) {
        this._update(e.deltaX, e.deltaY);
        return null;
      };

      ResizeToolView.prototype._update = function(dx, dy) {
        var canvas;
        this.plot_view.pause();
        canvas = this.plot_view.canvas;
        canvas._set_dims([this.cw + dx, this.ch + dy]);
        this.plot_view.request_render();
        this.plot_view.unpause();
        return null;
      };

      return ResizeToolView;

    })(GestureTool.View);
    ResizeTool = (function(_super) {
      __extends(ResizeTool, _super);

      function ResizeTool() {
        _ref1 = ResizeTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ResizeTool.prototype.default_view = ResizeToolView;

      ResizeTool.prototype.type = "ResizeTool";

      ResizeTool.prototype.tool_name = "Resize";

      ResizeTool.prototype.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAgCAYAAAB3j6rJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODVDNDBCQjIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODVDNDBCQzIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjMyMUREOEQ4MjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkE4NUM0MEJBMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+nIbQ0AAAAIJJREFUeNpiXLhs5X8G7ICRgTYAq31MDIMEwBzyERoCyJhWAN2ej4MqRFiIjUMahczgSyMsNE4PxACBQZlrcAFsuYkcLECpQwZNiIw6ZNQhow4ZdcioQ0YdMuoQerRZkQE/vdqwgypqQD7+MIBuANn9f1CnEcbRXIMjd4zM0QCAAAMAbdAPQaze1JcAAAAASUVORK5CYII=";

      ResizeTool.prototype.event_type = "pan";

      ResizeTool.prototype.default_order = 40;

      return ResizeTool;

    })(GestureTool.Model);
    ResizeTools = (function(_super) {
      __extends(ResizeTools, _super);

      function ResizeTools() {
        _ref2 = ResizeTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ResizeTools.prototype.model = ResizeTool;

      return ResizeTools;

    })(Collection);
    return {
      "Model": ResizeTool,
      "Collection": new ResizeTools(),
      "View": ResizeToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=resize_tool.js.map
*/