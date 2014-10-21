(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "tool/gestures/select_tool"], function(_, Collection, SelectTool) {
    var TapTool, TapToolView, TapTools, _ref, _ref1, _ref2;
    TapToolView = (function(_super) {
      __extends(TapToolView, _super);

      function TapToolView() {
        _ref = TapToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TapToolView.prototype._tap = function(e) {
        var append, canvas, vx, vy, _ref1;
        canvas = this.plot_view.canvas;
        vx = canvas.sx_to_vx(e.bokeh.sx);
        vy = canvas.sy_to_vy(e.bokeh.sy);
        append = (_ref1 = e.srcEvent.shiftKey) != null ? _ref1 : false;
        return this._select(vx, vy, append);
      };

      TapToolView.prototype._select = function(vx, vy, append) {
        var ds, geometry, r, sm, _i, _len, _ref1, _results;
        geometry = {
          type: 'point',
          vx: vx,
          vy: vy
        };
        _ref1 = this.mget('renderers');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          r = _ref1[_i];
          ds = r.get('data_source');
          sm = ds.get('selection_manager');
          _results.push(sm.select(this, this.plot_view.renderers[r.id], geometry, true, append));
        }
        return _results;
      };

      return TapToolView;

    })(SelectTool.View);
    TapTool = (function(_super) {
      __extends(TapTool, _super);

      function TapTool() {
        _ref1 = TapTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      TapTool.prototype.default_view = TapToolView;

      TapTool.prototype.type = "TapTool";

      TapTool.prototype.tool_name = "Tap";

      TapTool.prototype.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAMAAAAVv241AAAAA3NCSVQICAjb4U/gAAAA51BMVEX////+/v79/v78/f38/Pz6+/v6+vr4+Pj29/f29vf19fby8/Tx8fLx8vPx8vLw8fLu7+/q6+zm5+jl5+fk5ufj5OXh4+Ti4+Te3+Dd3+Dd3t/a3N7Z29zY2tvX2dvU1tfT1tfS1dbS1NbP0dPO0NLNz9HKzc/Kzc7JzM7Ex8nDx8nDxsjCxsjAxMa/w8TAw8W9wcO8wMK8wMG4u763u722ur23uryytrmztrmxtbivtLavs7aus7WtsrSusrWtsrWssbOssLOrsLKrr7Kmq66lqq2mqq2kqayjqKujqKqip6qip6uhpqmjmdHyAAAATXRSTlMA/////////////////////////////////////////////////////////////////////////////////////////////////////8TzpBEAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzbovLKMAAAAnElEQVQImUWO1xbBQBRF7xBEiDJqiF6iRIneSyQmuP//PUYS7Ke9X846AAAVxjTwGdxG/cMi4vk2KCVAPxLuRZu0pvoYTJWHPYwZAJqiznk829km5MRyfs1jtYRN1O5Cb8JDutN48oSGLH7WCo8quSDuZXebntM75CgBN8kV0TnNqHfCxJclfB+xUg0bvgsZCDMrBD86Dv1Hqg7wBukXEhG+uFsTAAAAAElFTkSuQmCC";

      TapTool.prototype.event_type = "tap";

      TapTool.prototype.default_order = 10;

      return TapTool;

    })(SelectTool.Model);
    TapTools = (function(_super) {
      __extends(TapTools, _super);

      function TapTools() {
        _ref2 = TapTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      TapTools.prototype.model = TapTool;

      return TapTools;

    })(Collection);
    return {
      "Model": TapTool,
      "Collection": new TapTools(),
      "View": TapToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tap_tool.js.map
*/