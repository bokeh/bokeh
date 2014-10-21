(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var MultiLine, MultiLineView, MultiLines, _ref, _ref1, _ref2;
    MultiLineView = (function(_super) {
      __extends(MultiLineView, _super);

      function MultiLineView() {
        _ref = MultiLineView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MultiLineView.prototype._fields = ['xs', 'ys'];

      MultiLineView.prototype._properties = ['line'];

      MultiLineView.prototype._render = function(ctx, indices) {
        var i, j, sx, sy, x, y, _i, _j, _len, _ref1, _ref2, _results;
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          x = this.xs[i];
          y = this.ys[i];
          _ref1 = this.renderer.map_to_screen(this.xs[i], this.glyph.xs.units, this.ys[i], this.glyph.ys.units), sx = _ref1[0], sy = _ref1[1];
          this.props.line.set_vectorize(ctx, i);
          for (j = _j = 0, _ref2 = sx.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
            if (j === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[j], sy[j]);
              continue;
            } else if (isNaN(sx[j]) || isNaN(sy[j])) {
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[j], sy[j]);
            }
          }
          _results.push(ctx.stroke());
        }
        return _results;
      };

      MultiLineView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return MultiLineView;

    })(Glyph.View);
    MultiLine = (function(_super) {
      __extends(MultiLine, _super);

      function MultiLine() {
        _ref1 = MultiLine.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      MultiLine.prototype.default_view = MultiLineView;

      MultiLine.prototype.type = 'MultiLine';

      MultiLine.prototype.display_defaults = function() {
        return _.extend({}, MultiLine.__super__.display_defaults.call(this), this.line_defaults);
      };

      return MultiLine;

    })(Glyph.Model);
    MultiLines = (function(_super) {
      __extends(MultiLines, _super);

      function MultiLines() {
        _ref2 = MultiLines.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      MultiLines.prototype.model = MultiLine;

      return MultiLines;

    })(Glyph.Collection);
    return {
      Model: MultiLine,
      View: MultiLineView,
      Collection: new MultiLines()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=multi_line.js.map
*/