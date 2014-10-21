(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "rbush", "renderer/properties", "./glyph"], function(_, rbush, Properties, Glyph) {
    var Quad, QuadView, Quads, _ref, _ref1, _ref2;
    QuadView = (function(_super) {
      __extends(QuadView, _super);

      function QuadView() {
        _ref = QuadView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      QuadView.prototype._fields = ['right', 'left', 'bottom', 'top'];

      QuadView.prototype._properties = ['line', 'fill'];

      QuadView.prototype._map_data = function() {
        var _ref1, _ref2;
        _ref1 = this.renderer.map_to_screen(this.left, this.glyph.left.units, this.top, this.glyph.top.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
        return _ref2 = this.renderer.map_to_screen(this.right, this.glyph.right.units, this.bottom, this.glyph.bottom.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1], _ref2;
      };

      QuadView.prototype._render = function(ctx, indices, sx0, sx1, sy0, sy1) {
        var i, _i, _len, _results;
        if (sx0 == null) {
          sx0 = this.sx0;
        }
        if (sx1 == null) {
          sx1 = this.sx1;
        }
        if (sy0 == null) {
          sy0 = this.sy0;
        }
        if (sy1 == null) {
          sy1 = this.sy1;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])) {
            continue;
          }
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            ctx.fillRect(sx0[i], sy0[i], sx1[i] - sx0[i], sy1[i] - sy0[i]);
          }
          if (this.props.line.do_stroke) {
            ctx.beginPath();
            ctx.rect(sx0[i], sy0[i], sx1[i] - sx0[i], sy1[i] - sy0[i]);
            this.props.line.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      QuadView.prototype._hit_point = function(geometry) {
        var hits, i, sx, sy, vx, vy, _i, _ref1, _ref2;
        _ref1 = [geometry.vx, geometry.vy], vx = _ref1[0], vy = _ref1[1];
        sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
        sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
        hits = [];
        for (i = _i = 0, _ref2 = this.sx0.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (sx >= this.sx0[i] && sx <= this.sx1[i] && sy >= this.sy0[i] && sy < this.sy1[i]) {
            hits.push(i);
          }
        }
        return hits;
      };

      QuadView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_area_legend(ctx, x0, x1, y0, y1);
      };

      return QuadView;

    })(Glyph.View);
    Quad = (function(_super) {
      __extends(Quad, _super);

      function Quad() {
        _ref1 = Quad.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Quad.prototype.default_view = QuadView;

      Quad.prototype.type = 'Quad';

      Quad.prototype.display_defaults = function() {
        return _.extend({}, Quad.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Quad;

    })(Glyph.Model);
    Quads = (function(_super) {
      __extends(Quads, _super);

      function Quads() {
        _ref2 = Quads.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Quads.prototype.model = Quad;

      return Quads;

    })(Glyph.Collection);
    return {
      Model: Quad,
      View: QuadView,
      Collection: new Quads()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=quad.js.map
*/