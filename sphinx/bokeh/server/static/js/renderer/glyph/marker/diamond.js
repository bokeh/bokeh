(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var Diamond, DiamondView, Diamonds, _ref, _ref1, _ref2;
    DiamondView = (function(_super) {
      __extends(DiamondView, _super);

      function DiamondView() {
        _ref = DiamondView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DiamondView.prototype._properties = ['line', 'fill'];

      DiamondView.prototype._render = function(ctx, indices, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          r = size[i] / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i] + r);
          ctx.lineTo(sx[i] + r, sy[i]);
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.lineTo(sx[i] - r, sy[i]);
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

      return DiamondView;

    })(Marker.View);
    Diamond = (function(_super) {
      __extends(Diamond, _super);

      function Diamond() {
        _ref1 = Diamond.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Diamond.prototype.default_view = DiamondView;

      Diamond.prototype.type = 'Diamond';

      Diamond.prototype.display_defaults = function() {
        return _.extend({}, Diamond.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Diamond;

    })(Marker.Model);
    Diamonds = (function(_super) {
      __extends(Diamonds, _super);

      function Diamonds() {
        _ref2 = Diamonds.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Diamonds.prototype.model = Diamond;

      return Diamonds;

    })(Marker.Collection);
    return {
      Model: Diamond,
      View: DiamondView,
      Collection: new Diamonds()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=diamond.js.map
*/