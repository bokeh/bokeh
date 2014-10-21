(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Patch, PatchView, Patches, _ref, _ref1, _ref2;
    PatchView = (function(_super) {
      __extends(PatchView, _super);

      function PatchView() {
        _ref = PatchView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PatchView.prototype._fields = ['x', 'y'];

      PatchView.prototype._properties = ['line', 'fill'];

      PatchView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      PatchView.prototype._render = function(ctx, indices) {
        var i, _i, _j, _len, _len1;
        if (this.props.fill.do_fill) {
          this.props.fill.set(ctx, this.props);
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(this.sx[i], this.sy[i]);
              continue;
            } else if (isNaN(this.sx[i] + this.sy[i])) {
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(this.sx[i], this.sy[i]);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
        if (this.props.line.do_stroke) {
          this.props.line.set(ctx, this.props);
          for (_j = 0, _len1 = indices.length; _j < _len1; _j++) {
            i = indices[_j];
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(this.sx[i], this.sy[i]);
              continue;
            } else if (isNaN(this.sx[i] + this.sy[i])) {
              ctx.closePath();
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(this.sx[i], this.sy[i]);
            }
          }
          ctx.closePath();
          return ctx.stroke();
        }
      };

      PatchView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_area_legend(ctx, x0, x1, y0, y1);
      };

      return PatchView;

    })(Glyph.View);
    Patch = (function(_super) {
      __extends(Patch, _super);

      function Patch() {
        _ref1 = Patch.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Patch.prototype.default_view = PatchView;

      Patch.prototype.type = 'Patch';

      Patch.prototype.display_defaults = function() {
        return _.extend({}, Patch.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Patch;

    })(Glyph.Model);
    Patches = (function(_super) {
      __extends(Patches, _super);

      function Patches() {
        _ref2 = Patches.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Patches.prototype.model = Patch;

      return Patches;

    })(Glyph.Collection);
    return {
      Model: Patch,
      View: PatchView,
      Collection: new Patches()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=patch.js.map
*/