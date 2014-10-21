(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Oval, OvalView, Ovals, _ref, _ref1, _ref2;
    OvalView = (function(_super) {
      __extends(OvalView, _super);

      function OvalView() {
        _ref = OvalView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      OvalView.prototype._fields = ['x', 'y', 'width', 'height', 'angle'];

      OvalView.prototype._properties = ['line', 'fill'];

      OvalView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'width', 'center');
        return this.sh = this.distance_vector('y', 'height', 'center');
      };

      OvalView.prototype._render = function(ctx, indices, sx, sy, sw, sh) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (sw == null) {
          sw = this.sw;
        }
        if (sh == null) {
          sh = this.sh;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + sw[i] + sh[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(sx[i], sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.beginPath();
          ctx.moveTo(0, -sh[i] / 2);
          ctx.bezierCurveTo(sw[i] / 2, -sh[i] / 2, sw[i] / 2, sh[i] / 2, 0, sh[i] / 2);
          ctx.bezierCurveTo(-sw[i] / 2, sh[i] / 2, -sw[i] / 2, -sh[i] / 2, 0, -sh[i] / 2);
          ctx.closePath();
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            ctx.stroke();
          }
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      OvalView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var d, indices, reference_point, scale, sh, sw, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        scale = this.sw[reference_point] / this.sh[reference_point];
        d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.8;
        sw = {};
        sh = {};
        if (scale > 1) {
          sw[reference_point] = d;
          sh[reference_point] = d / scale;
        } else {
          sw[reference_point] = d * scale;
          sh[reference_point] = d;
        }
        return this._render(ctx, indices, sx, sy, sw, sh);
      };

      return OvalView;

    })(Glyph.View);
    Oval = (function(_super) {
      __extends(Oval, _super);

      function Oval() {
        _ref1 = Oval.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Oval.prototype.default_view = OvalView;

      Oval.prototype.type = 'Oval';

      Oval.prototype.display_defaults = function() {
        return _.extend({}, Oval.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults, {
          angle: 0.0
        });
      };

      return Oval;

    })(Glyph.Model);
    Ovals = (function(_super) {
      __extends(Ovals, _super);

      function Ovals() {
        _ref2 = Ovals.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Ovals.prototype.model = Oval;

      return Ovals;

    })(Glyph.Collection);
    return {
      Model: Oval,
      View: OvalView,
      Collection: new Ovals()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=oval.js.map
*/