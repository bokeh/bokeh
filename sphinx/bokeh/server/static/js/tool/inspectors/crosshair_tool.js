(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "renderer/annotation/span", "./inspect_tool"], function(_, Collection, Span, InspectTool) {
    var CrosshairTool, CrosshairToolView, CrosshairTools, _ref, _ref1, _ref2;
    CrosshairToolView = (function(_super) {
      __extends(CrosshairToolView, _super);

      function CrosshairToolView() {
        _ref = CrosshairToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CrosshairToolView.prototype._move = function(e) {
        var canvas, dim, frame, span, vx, vy, _i, _len, _ref1, _results;
        if (!this.mget('active')) {
          return;
        }
        frame = this.plot_model.get('frame');
        canvas = this.plot_model.get('canvas');
        vx = canvas.sx_to_vx(e.bokeh.sx);
        vy = canvas.sy_to_vy(e.bokeh.sy);
        _ref1 = this.mget('dimensions');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          dim = _ref1[_i];
          span = this.mget('spans')[dim];
          if (!frame.contains(vx, vy)) {
            _results.push(span.unset('location'));
          } else {
            if (dim === "width") {
              _results.push(span.set('location', vy));
            } else {
              _results.push(span.set('location', vx));
            }
          }
        }
        return _results;
      };

      CrosshairToolView.prototype._move_exit = function(e) {
        var dim, span, _i, _len, _ref1, _results;
        _ref1 = this.mget('dimensions');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          dim = _ref1[_i];
          span = this.mget('spans')[dim];
          _results.push(span.unset('location'));
        }
        return _results;
      };

      return CrosshairToolView;

    })(InspectTool.View);
    CrosshairTool = (function(_super) {
      __extends(CrosshairTool, _super);

      function CrosshairTool() {
        _ref1 = CrosshairTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CrosshairTool.prototype.default_view = CrosshairToolView;

      CrosshairTool.prototype.type = "CrosshairTool";

      CrosshairTool.prototype.tool_name = "Crosshair";

      CrosshairTool.prototype.initialize = function(attrs, options) {
        var renderers;
        CrosshairTool.__super__.initialize.call(this, attrs, options);
        this.register_property('tooltip', function() {
          return this._get_dim_tooltip("Crosshair", this._check_dims(this.get('dimensions'), "crosshair tool"));
        }, false);
        this.add_dependencies('tooltip', this, ['dimensions']);
        this.set('spans', {
          width: new Span.Model({
            dimension: "width"
          }),
          height: new Span.Model({
            dimension: "height"
          })
        });
        renderers = this.get('plot').get('renderers');
        renderers.push(this.get('spans').width);
        renderers.push(this.get('spans').height);
        return this.get('plot').set('renderers', renderers);
      };

      CrosshairTool.prototype.defaults = function() {
        return _.extend({}, CrosshairTool.__super__.defaults.call(this), {
          dimensions: ["width", "height"]
        });
      };

      return CrosshairTool;

    })(InspectTool.Model);
    CrosshairTools = (function(_super) {
      __extends(CrosshairTools, _super);

      function CrosshairTools() {
        _ref2 = CrosshairTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CrosshairTools.prototype.model = CrosshairTool;

      return CrosshairTools;

    })(Collection);
    return {
      "Model": CrosshairTool,
      "Collection": new CrosshairTools(),
      "View": CrosshairToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=crosshair_tool.js.map
*/