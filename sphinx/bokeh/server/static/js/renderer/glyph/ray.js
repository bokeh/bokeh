(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Ray, RayView, Rays, _ref, _ref1, _ref2;
    RayView = (function(_super) {
      __extends(RayView, _super);

      function RayView() {
        _ref = RayView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RayView.prototype._fields = ['x', 'y', 'angle', 'length'];

      RayView.prototype._properties = ['line'];

      RayView.prototype._map_data = function() {
        var height, i, inf_len, width, _i, _ref1, _ref2, _results;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.length = this.distance_vector('x', 'length', 'edge');
        width = this.renderer.plot_view.frame.get('width');
        height = this.renderer.plot_view.frame.get('height');
        inf_len = 2 * (width + height);
        _results = [];
        for (i = _i = 0, _ref2 = this.length.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (this.length[i] === 0) {
            _results.push(this.length[i] = inf_len);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      RayView.prototype._render = function(ctx, indices) {
        var i, _i, _len, _results;
        if (this.props.line.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(this.sx[i] + this.sy[i] + this.angle[i] + this.length[i])) {
              continue;
            }
            ctx.translate(this.sx[i], this.sy[i]);
            ctx.rotate(this.angle[i]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.length[i], 0);
            this.props.line.set_vectorize(ctx, i);
            ctx.stroke();
            ctx.rotate(-this.angle[i]);
            _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
          }
          return _results;
        }
      };

      RayView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return RayView;

    })(Glyph.View);
    Ray = (function(_super) {
      __extends(Ray, _super);

      function Ray() {
        _ref1 = Ray.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Ray.prototype.default_view = RayView;

      Ray.prototype.type = 'Ray';

      Ray.prototype.display_defaults = function() {
        return _.extend({}, Ray.__super__.display_defaults.call(this), this.line_defaults);
      };

      return Ray;

    })(Glyph.Model);
    Rays = (function(_super) {
      __extends(Rays, _super);

      function Rays() {
        _ref2 = Rays.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Rays.prototype.model = Ray;

      return Rays;

    })(Glyph.Collection);
    return {
      Model: Ray,
      View: RayView,
      Collection: new Rays()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=ray.js.map
*/