(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "gear_utils", "renderer/properties", "util/bezier", "./glyph"], function(_, GearUtils, Properties, Bezier, Glyph) {
    var Gear, GearView, Gears, _ref, _ref1, _ref2;
    GearView = (function(_super) {
      __extends(GearView, _super);

      function GearView() {
        _ref = GearView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GearView.prototype._fields = ['x', 'y', 'angle', 'module', 'teeth', 'pressure_angle', 'shaft_size', 'internal:boolean'];

      GearView.prototype._properties = ['line', 'fill'];

      GearView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.smodule = this.distance_vector('x', 'module', 'edge');
      };

      GearView.prototype._render = function(ctx, indices) {
        var M, angle, fn, i, internal, j, module, pitch_radius, pressure_angle, rim_radius, rot, seq, seq0, shaft_radius, shaft_size, sx, sy, teeth, x, y, _i, _j, _len, _ref1, _ref2;
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          _ref1 = [this.sx[i], this.sy[i], this.angle[i], this.smodule[i], this.teeth[i], this.pressure_angle[i], this.shaft_size[i], this.internal[i]], sx = _ref1[0], sy = _ref1[1], angle = _ref1[2], module = _ref1[3], teeth = _ref1[4], pressure_angle = _ref1[5], shaft_size = _ref1[6], internal = _ref1[7];
          if (isNaN(sx + sy + angle + module + teeth + pressure_angle + shaft_size + internal)) {
            continue;
          }
          pitch_radius = module * teeth / 2;
          if (internal) {
            fn = GearUtils.create_internal_gear_tooth;
          } else {
            fn = GearUtils.create_gear_tooth;
          }
          seq0 = fn(module, teeth, pressure_angle);
          _ref2 = seq0.slice(0, 3), M = _ref2[0], x = _ref2[1], y = _ref2[2];
          seq = seq0.slice(3);
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.beginPath();
          rot = 2 * Math.PI / teeth;
          ctx.moveTo(x, y);
          for (j = _j = 0; 0 <= teeth ? _j < teeth : _j > teeth; j = 0 <= teeth ? ++_j : --_j) {
            this._render_seq(ctx, seq);
            ctx.rotate(rot);
          }
          ctx.closePath();
          if (internal) {
            rim_radius = pitch_radius + 2.75 * module;
            ctx.moveTo(rim_radius, 0);
            ctx.arc(0, 0, rim_radius, 0, 2 * Math.PI, true);
          } else if (shaft_size > 0) {
            shaft_radius = pitch_radius * shaft_size;
            ctx.moveTo(shaft_radius, 0);
            ctx.arc(0, 0, shaft_radius, 0, 2 * Math.PI, true);
          }
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            ctx.stroke();
          }
          ctx.restore();
        }
      };

      GearView.prototype._render_seq = function(ctx, seq) {
        var c, cx0, cx1, cy0, cy1, i, large_arc, px, py, rx, ry, segments, sweep, x, x_rotation, y, _i, _len, _ref1, _ref10, _ref11, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        i = 0;
        while (i < seq.length) {
          if (_.isString(seq[i])) {
            c = seq[i];
            i += 1;
          }
          switch (c) {
            case "M":
              _ref1 = seq.slice(i, i + 2), x = _ref1[0], y = _ref1[1];
              ctx.moveTo(x, y);
              _ref2 = [x, y], px = _ref2[0], py = _ref2[1];
              i += 2;
              break;
            case "L":
              _ref3 = seq.slice(i, i + 2), x = _ref3[0], y = _ref3[1];
              ctx.lineTo(x, y);
              _ref4 = [x, y], px = _ref4[0], py = _ref4[1];
              i += 2;
              break;
            case "C":
              _ref5 = seq.slice(i, i + 6), cx0 = _ref5[0], cy0 = _ref5[1], cx1 = _ref5[2], cy1 = _ref5[3], x = _ref5[4], y = _ref5[5];
              ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y);
              _ref6 = [x, y], px = _ref6[0], py = _ref6[1];
              i += 6;
              break;
            case "Q":
              _ref7 = seq.slice(i, i + 4), cx0 = _ref7[0], cy0 = _ref7[1], x = _ref7[2], y = _ref7[3];
              ctx.quadraticCurveTo(cx0, cy0, x, y);
              _ref8 = [x, y], px = _ref8[0], py = _ref8[1];
              i += 4;
              break;
            case "A":
              _ref9 = seq.slice(i, i + 7), rx = _ref9[0], ry = _ref9[1], x_rotation = _ref9[2], large_arc = _ref9[3], sweep = _ref9[4], x = _ref9[5], y = _ref9[6];
              segments = Bezier.arc_to_bezier(px, py, rx, ry, -x_rotation, large_arc, 1 - sweep, x, y);
              for (_i = 0, _len = segments.length; _i < _len; _i++) {
                _ref10 = segments[_i], cx0 = _ref10[0], cy0 = _ref10[1], cx1 = _ref10[2], cy1 = _ref10[3], x = _ref10[4], y = _ref10[5];
                ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x, y);
              }
              _ref11 = [x, y], px = _ref11[0], py = _ref11[1];
              i += 7;
              break;
            default:
              throw new Error("unexpected command: " + c);
          }
        }
      };

      GearView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return GearView;

    })(Glyph.View);
    Gear = (function(_super) {
      __extends(Gear, _super);

      function Gear() {
        _ref1 = Gear.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Gear.prototype.default_view = GearView;

      Gear.prototype.type = 'Gear';

      Gear.prototype.defaults = function() {
        return _.extend({}, Gear.__super__.defaults.call(this), {
          x: void 0,
          y: void 0,
          angle: 0,
          module: void 0,
          teeth: void 0,
          pressure_angle: 20,
          shaft_size: 0.3,
          internal: false
        });
      };

      Gear.prototype.display_defaults = function() {
        return _.extend({}, Gear.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Gear;

    })(Glyph.Model);
    Gears = (function(_super) {
      __extends(Gears, _super);

      function Gears() {
        _ref2 = Gears.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Gears.prototype.model = Gear;

      return Gears;

    })(Glyph.Collection);
    return {
      Model: Gear,
      View: GearView,
      Collection: new Gears()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=gear.js.map
*/