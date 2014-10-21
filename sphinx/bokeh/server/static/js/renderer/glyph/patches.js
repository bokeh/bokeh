(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "rbush", "renderer/properties", "./glyph"], function(_, rbush, Properties, Glyph) {
    var Patches, PatchesView, Patcheses, point_in_poly, _ref, _ref1, _ref2;
    point_in_poly = function(x, y, px, py) {
      var i, inside, x1, x2, y1, y2, _i, _ref;
      inside = false;
      x1 = px[px.length - 1];
      y1 = py[py.length - 1];
      for (i = _i = 0, _ref = px.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        x2 = px[i];
        y2 = py[i];
        if ((y1 < y) !== (y2 < y)) {
          if (x1 + (y - y1) / (y2 - y1) * (x2 - x1) < x) {
            inside = !inside;
          }
        }
        x1 = x2;
        y1 = y2;
      }
      return inside;
    };
    PatchesView = (function(_super) {
      __extends(PatchesView, _super);

      function PatchesView() {
        _ref = PatchesView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PatchesView.prototype._fields = ['xs', 'ys'];

      PatchesView.prototype._properties = ['line', 'fill'];

      PatchesView.prototype._set_data = function() {
        var i, pts, x, xs, y, ys, _i, _ref1;
        this.max_size = _.max(this.size);
        this.index = rbush();
        pts = [];
        for (i = _i = 0, _ref1 = this.xs.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          xs = (function() {
            var _j, _len, _ref2, _results;
            _ref2 = this.xs[i];
            _results = [];
            for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
              x = _ref2[_j];
              if (!_.isNaN(x)) {
                _results.push(x);
              }
            }
            return _results;
          }).call(this);
          ys = (function() {
            var _j, _len, _ref2, _results;
            _ref2 = this.ys[i];
            _results = [];
            for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
              y = _ref2[_j];
              if (!_.isNaN(y)) {
                _results.push(y);
              }
            }
            return _results;
          }).call(this);
          if (xs.length === 0) {
            continue;
          }
          pts.push([
            _.min(xs), _.min(ys), _.max(xs), _.max(ys), {
              'i': i
            }
          ]);
        }
        return this.index.load(pts);
      };

      PatchesView.prototype._map_data = function() {
        var i, sx, sy, _i, _ref1, _ref2, _results;
        this.sxs = [];
        this.sys = [];
        _results = [];
        for (i = _i = 0, _ref1 = this.xs.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          _ref2 = this.renderer.map_to_screen(this.xs[i], this.glyph.xs.units, this.ys[i], this.glyph.ys.units), sx = _ref2[0], sy = _ref2[1];
          this.sxs.push(sx);
          _results.push(this.sys.push(sy));
        }
        return _results;
      };

      PatchesView.prototype._mask_data = function() {
        var x, x0, x1, xr, y0, y1, yr, _ref1, _ref2;
        if (this.glyph.xs.units === "screen" || this.glyph.ys.units === "screen") {
          return this.all_indices;
        }
        xr = this.renderer.plot_view.x_range;
        _ref1 = [xr.get('start'), xr.get('end')], x0 = _ref1[0], x1 = _ref1[1];
        yr = this.renderer.plot_view.y_range;
        _ref2 = [yr.get('start'), yr.get('end')], y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      PatchesView.prototype._render = function(ctx, indices) {
        var i, j, sx, sy, _i, _j, _k, _len, _ref1, _ref2, _ref3, _results;
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          _ref1 = [this.sxs[i], this.sys[i]], sx = _ref1[0], sy = _ref1[1];
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            for (j = _j = 0, _ref2 = sx.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
              if (j === 0) {
                ctx.beginPath();
                ctx.moveTo(sx[j], sy[j]);
                continue;
              } else if (isNaN(sx[j] + sy[j])) {
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                continue;
              } else {
                ctx.lineTo(sx[j], sy[j]);
              }
            }
            ctx.closePath();
            ctx.fill();
          }
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            for (j = _k = 0, _ref3 = sx.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; j = 0 <= _ref3 ? ++_k : --_k) {
              if (j === 0) {
                ctx.beginPath();
                ctx.moveTo(sx[j], sy[j]);
                continue;
              } else if (isNaN(sx[j] + sy[j])) {
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                continue;
              } else {
                ctx.lineTo(sx[j], sy[j]);
              }
            }
            ctx.closePath();
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      PatchesView.prototype._hit_point = function(geometry) {
        var candidates, hits, i, idx, sx, sy, vx, vy, x, y, _i, _ref1, _ref2;
        _ref1 = [geometry.vx, geometry.vy], vx = _ref1[0], vy = _ref1[1];
        sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
        sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
        x = this.renderer.xmapper.map_from_target(vx);
        y = this.renderer.ymapper.map_from_target(vy);
        candidates = (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.index.search([x, y, x, y]);
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            x = _ref2[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
        hits = [];
        for (i = _i = 0, _ref2 = candidates.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          idx = candidates[i];
          if (point_in_poly(sx, sy, this.sxs[idx], this.sys[idx])) {
            hits.push(idx);
          }
        }
        return hits;
      };

      PatchesView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_area_legend(ctx, x0, x1, y0, y1);
      };

      return PatchesView;

    })(Glyph.View);
    Patches = (function(_super) {
      __extends(Patches, _super);

      function Patches() {
        _ref1 = Patches.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Patches.prototype.default_view = PatchesView;

      Patches.prototype.type = 'Patches';

      Patches.prototype.display_defaults = function() {
        return _.extend({}, Patches.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Patches;

    })(Glyph.Model);
    Patcheses = (function(_super) {
      __extends(Patcheses, _super);

      function Patcheses() {
        _ref2 = Patcheses.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Patcheses.prototype.model = Patches;

      return Patcheses;

    })(Glyph.Collection);
    return {
      Model: Patches,
      View: PatchesView,
      Collection: new Patcheses()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=patches.js.map
*/