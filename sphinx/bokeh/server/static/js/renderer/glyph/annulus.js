(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "rbush", "renderer/properties", "./glyph"], function(_, rbush, Properties, Glyph) {
    var Annulus, AnnulusView, Annuluses, _ref, _ref1, _ref2;
    AnnulusView = (function(_super) {
      __extends(AnnulusView, _super);

      function AnnulusView() {
        _ref = AnnulusView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AnnulusView.prototype._fields = ['x', 'y', 'inner_radius', 'outer_radius'];

      AnnulusView.prototype._properties = ['line', 'fill'];

      AnnulusView.prototype._set_data = function() {
        var i, pts, _i, _ref1;
        this.max_radius = _.max(this.outer_radius);
        this.index = rbush();
        pts = [];
        for (i = _i = 0, _ref1 = this.x.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (!isNaN(this.x[i] + this.y[i])) {
            pts.push([
              this.x[i], this.y[i], this.x[i], this.y[i], {
                'i': i
              }
            ]);
          }
        }
        return this.index.load(pts);
      };

      AnnulusView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.inner_radius = this.distance_vector('x', 'inner_radius', 'edge');
        return this.outer_radius = this.distance_vector('x', 'outer_radius', 'edge');
      };

      AnnulusView.prototype._render = function(ctx, indices, sx, sy, inner_radius, outer_radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (inner_radius == null) {
          inner_radius = this.inner_radius;
        }
        if (outer_radius == null) {
          outer_radius = this.outer_radius;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], inner_radius[i], 0, 2 * Math.PI * 2, false);
          ctx.moveTo(sx[i] + outer_radius[i], sy[i]);
          ctx.arc(sx[i], sy[i], outer_radius[i], 0, 2 * Math.PI * 2, true);
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      AnnulusView.prototype._hit_point = function(geometry) {
        var candidates, candidates2, dist, hits, i, pt, r2, sx, sx0, sx1, sy, sy0, sy1, vx, vx0, vx1, vy, vy0, vy1, x, x0, x1, y, y0, y1, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref1, _ref2, _ref3, _ref4, _ref5;
        _ref1 = [geometry.vx, geometry.vy], vx = _ref1[0], vy = _ref1[1];
        x = this.renderer.xmapper.map_from_target(vx);
        y = this.renderer.ymapper.map_from_target(vy);
        if (this.outer_radius_units === "screen") {
          vx0 = vx - this.max_radius;
          vx1 = vx + this.max_radius;
          _ref2 = this.renderer.xmapper.v_map_from_target([vx0, vx1]), x0 = _ref2[0], x1 = _ref2[1];
          vy0 = vy - this.max_radius;
          vy1 = vy + this.max_radius;
          _ref3 = this.renderer.ymapper.v_map_from_target([vy0, vy1]), y0 = _ref3[0], y1 = _ref3[1];
        } else {
          x0 = x - this.max_radius;
          x1 = x + this.max_radius;
          y0 = y - this.max_radius;
          y1 = y + this.max_radius;
        }
        candidates = (function() {
          var _i, _len, _ref4, _results;
          _ref4 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            pt = _ref4[_i];
            _results.push(pt[4].i);
          }
          return _results;
        }).call(this);
        candidates2 = [];
        if (this.outer_radius_units === "screen") {
          sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
          sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
          for (_i = 0, _len = candidates.length; _i < _len; _i++) {
            i = candidates[_i];
            r2 = Math.pow(this.outer_radius[i], 2);
            dist = Math.pow(this.sx[i] - sx, 2) + Math.pow(this.sy[i] - sy, 2);
            if (dist <= r2) {
              candidates2.push([i, dist]);
            }
          }
        } else {
          for (_j = 0, _len1 = candidates.length; _j < _len1; _j++) {
            i = candidates[_j];
            r2 = Math.pow(this.outer_radius[i], 2);
            sx0 = this.renderer.xmapper.map_to_target(x);
            sx1 = this.renderer.xmapper.map_to_target(this.x[i]);
            sy0 = this.renderer.ymapper.map_to_target(y);
            sy1 = this.renderer.ymapper.map_to_target(this.y[i]);
            dist = Math.pow(sx0 - sx1, 2) + Math.pow(sy0 - sy1, 2);
            if (dist <= r2) {
              candidates2.push([i, dist]);
            }
          }
        }
        hits = [];
        if (this.inner_radius_units === "screen") {
          sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
          sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
          for (_k = 0, _len2 = candidates2.length; _k < _len2; _k++) {
            _ref4 = candidates2[_k], i = _ref4[0], dist = _ref4[1];
            r2 = Math.pow(this.inner_radius[i], 2);
            if (dist >= r2) {
              hits.push([i, dist]);
            }
          }
        } else {
          for (_l = 0, _len3 = candidates2.length; _l < _len3; _l++) {
            _ref5 = candidates2[_l], i = _ref5[0], dist = _ref5[1];
            r2 = Math.pow(this.inner_radius[i], 2);
            sx0 = this.renderer.xmapper.map_to_target(x);
            sx1 = this.renderer.xmapper.map_to_target(this.x[i]);
            sy0 = this.renderer.ymapper.map_to_target(y);
            sy1 = this.renderer.ymapper.map_to_target(this.y[i]);
            if (dist >= r2) {
              hits.push([i, dist]);
            }
          }
        }
        hits = _.chain(hits).sortBy(function(elt) {
          return elt[1];
        }).map(function(elt) {
          return elt[0];
        }).value();
        return hits;
      };

      AnnulusView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, inner_radius, outer_radius, r, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        r = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
        inner_radius = {};
        inner_radius[reference_point] = r * 0.4;
        outer_radius = {};
        outer_radius[reference_point] = r * 0.8;
        return this._render(ctx, indices, sx, sy, inner_radius, outer_radius);
      };

      return AnnulusView;

    })(Glyph.View);
    Annulus = (function(_super) {
      __extends(Annulus, _super);

      function Annulus() {
        _ref1 = Annulus.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Annulus.prototype.default_view = AnnulusView;

      Annulus.prototype.type = 'Annulus';

      Annulus.prototype.display_defaults = function() {
        return _.extend({}, Annulus.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Annulus;

    })(Glyph.Model);
    Annuluses = (function(_super) {
      __extends(Annuluses, _super);

      function Annuluses() {
        _ref2 = Annuluses.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Annuluses.prototype.model = Annulus;

      return Annuluses;

    })(Glyph.Collection);
    return {
      Model: Annulus,
      View: AnnulusView,
      Collection: new Annuluses()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=annulus.js.map
*/