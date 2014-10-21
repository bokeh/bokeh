(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Line, LineView, Lines, _ref, _ref1, _ref2;
    LineView = (function(_super) {
      __extends(LineView, _super);

      function LineView() {
        _ref = LineView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LineView.prototype._fields = ['x', 'y'];

      LineView.prototype._properties = ['line'];

      LineView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      LineView.prototype._render = function(ctx, indices) {
        var drawing, i, _i, _len;
        drawing = false;
        this.props.line.set(ctx, this.props);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i]) && drawing) {
            ctx.stroke();
            ctx.beginPath();
            drawing = false;
            continue;
          }
          if (drawing) {
            ctx.lineTo(this.sx[i], this.sy[i]);
          } else {
            ctx.beginPath();
            ctx.moveTo(this.sx[i], this.sy[i]);
            drawing = true;
          }
        }
        if (drawing) {
          return ctx.stroke();
        }
      };

      LineView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return LineView;

    })(Glyph.View);
    Line = (function(_super) {
      __extends(Line, _super);

      function Line() {
        _ref1 = Line.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Line.prototype.default_view = LineView;

      Line.prototype.type = 'Line';

      Line.prototype.display_defaults = function() {
        return _.extend({}, Line.__super__.display_defaults.call(this), this.line_defaults);
      };

      return Line;

    })(Glyph.Model);
    Lines = (function(_super) {
      __extends(Lines, _super);

      function Lines() {
        _ref2 = Lines.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Lines.prototype.model = Line;

      return Lines;

    })(Glyph.Collection);
    return {
      Model: Line,
      View: LineView,
      Collection: new Lines()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=line.js.map
*/