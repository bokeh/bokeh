(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "rbush", "common/mathutils", "renderer/properties", "./glyph"], function(_, rbush, mathutils, Properties, Glyph) {
    var Wedge, WedgeView, Wedges, _ref, _ref1, _ref2;
    WedgeView = (function(_super) {
      __extends(WedgeView, _super);

      function WedgeView() {
        _ref = WedgeView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      WedgeView.prototype._fields = ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'];

      WedgeView.prototype._properties = ['line', 'fill'];

      WedgeView.prototype._set_data = function() {
        var i, pts, _i, _ref1;
        this.max_radius = _.max(this.radius);
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

      WedgeView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.radius = this.distance_vector('x', 'radius', 'edge');
      };

      WedgeView.prototype._render = function(ctx, indices, sx, sy, radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (radius == null) {
          radius = this.radius;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          ctx.lineTo(sx[i], sy[i]);
          ctx.closePath();
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

      WedgeView.prototype._hit_point = function(geometry) {
        var angle, candidates, candidates2, dist, hits, i, pt, r2, sx, sx0, sx1, sy, sy0, sy1, vx, vx0, vx1, vy, vy0, vy1, x, x0, x1, y, y0, y1, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4;
        _ref1 = [geometry.vx, geometry.vy], vx = _ref1[0], vy = _ref1[1];
        x = this.renderer.xmapper.map_from_target(vx);
        y = this.renderer.ymapper.map_from_target(vy);
        if (this.radius_units === "screen") {
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
        if (this.radius_units === "screen") {
          sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
          sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
          for (_i = 0, _len = candidates.length; _i < _len; _i++) {
            i = candidates[_i];
            r2 = Math.pow(this.radius[i], 2);
            dist = Math.pow(this.sx[i] - sx, 2) + Math.pow(this.sy[i] - sy, 2);
            if (dist <= r2) {
              candidates2.push([i, dist]);
            }
          }
        } else {
          for (_j = 0, _len1 = candidates.length; _j < _len1; _j++) {
            i = candidates[_j];
            r2 = Math.pow(this.radius[i], 2);
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
        for (_k = 0, _len2 = candidates2.length; _k < _len2; _k++) {
          _ref4 = candidates2[_k], i = _ref4[0], dist = _ref4[1];
          sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
          sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
          angle = Math.atan2(sy - this.sy[i], sx - this.sx[i]);
          if (mathutils.angle_between(-angle, -this.start_angle[i], -this.end_angle[i], this.direction[i])) {
            hits.push([i, dist]);
          }
        }
        hits = _.chain(hits).sortBy(function(elt) {
          return elt[1];
        }).map(function(elt) {
          return elt[0];
        }).value();
        return hits;
      };

      WedgeView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, radius, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        radius = {};
        radius[reference_point] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.4;
        return this._render(ctx, indices, sx, sy, radius);
      };

      return WedgeView;

    })(Glyph.View);
    Wedge = (function(_super) {
      __extends(Wedge, _super);

      function Wedge() {
        _ref1 = Wedge.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Wedge.prototype.default_view = WedgeView;

      Wedge.prototype.type = 'Wedge';

      Wedge.prototype.display_defaults = function() {
        return _.extend({}, Wedge.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults, {
          direction: 'anticlock'
        });
      };

      return Wedge;

    })(Glyph.Model);
    Wedges = (function(_super) {
      __extends(Wedges, _super);

      function Wedges() {
        _ref2 = Wedges.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Wedges.prototype.model = Wedge;

      return Wedges;

    })(Glyph.Collection);
    return {
      Model: Wedge,
      View: WedgeView,
      Collection: new Wedges()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=wedge.js.map
*/