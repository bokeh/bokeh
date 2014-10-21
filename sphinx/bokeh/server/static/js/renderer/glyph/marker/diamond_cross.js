(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var DiamondCross, DiamondCrossView, DiamondCrosses, _ref, _ref1, _ref2;
    DiamondCrossView = (function(_super) {
      __extends(DiamondCrossView, _super);

      function DiamondCrossView() {
        _ref = DiamondCrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DiamondCrossView.prototype._properties = ['line', 'fill'];

      DiamondCrossView.prototype._render = function(ctx, indices, sx, sy, size) {
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
            ctx.moveTo(sx[i], sy[i] + r);
            ctx.lineTo(sx[i], sy[i] - r);
            ctx.moveTo(sx[i] - r, sy[i]);
            ctx.lineTo(sx[i] + r, sy[i]);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return DiamondCrossView;

    })(Marker.View);
    DiamondCross = (function(_super) {
      __extends(DiamondCross, _super);

      function DiamondCross() {
        _ref1 = DiamondCross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DiamondCross.prototype.default_view = DiamondCrossView;

      DiamondCross.prototype.type = 'DiamondCross';

      DiamondCross.prototype.display_defaults = function() {
        return _.extend({}, DiamondCross.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return DiamondCross;

    })(Marker.Model);
    DiamondCrosses = (function(_super) {
      __extends(DiamondCrosses, _super);

      function DiamondCrosses() {
        _ref2 = DiamondCrosses.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DiamondCrosses.prototype.model = DiamondCross;

      return DiamondCrosses;

    })(Marker.Collection);
    return {
      Model: DiamondCross,
      View: DiamondCrossView,
      Collection: new DiamondCrosses()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=diamond_cross.js.map
*/