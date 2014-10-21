(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var SquareCross, SquareCrossView, SquareCrosses, _ref, _ref1, _ref2;
    SquareCrossView = (function(_super) {
      __extends(SquareCrossView, _super);

      function SquareCrossView() {
        _ref = SquareCrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SquareCrossView.prototype._properties = ['line', 'fill'];

      SquareCrossView.prototype._render = function(ctx, indices, sx, sy, size) {
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
          ctx.translate(sx[i], sy[i]);
          ctx.beginPath();
          ctx.rect(-size[i] / 2, -size[i] / 2, size[i], size[i]);
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            r = size[i] / 2;
            ctx.moveTo(0, +r);
            ctx.lineTo(0, -r);
            ctx.moveTo(-r, 0);
            ctx.lineTo(+r, 0);
            ctx.stroke();
          }
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      return SquareCrossView;

    })(Marker.View);
    SquareCross = (function(_super) {
      __extends(SquareCross, _super);

      function SquareCross() {
        _ref1 = SquareCross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      SquareCross.prototype.default_view = SquareCrossView;

      SquareCross.prototype.type = 'SquareCross';

      SquareCross.prototype.display_defaults = function() {
        return _.extend({}, SquareCross.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return SquareCross;

    })(Marker.Model);
    SquareCrosses = (function(_super) {
      __extends(SquareCrosses, _super);

      function SquareCrosses() {
        _ref2 = SquareCrosses.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      SquareCrosses.prototype.model = SquareCross;

      return SquareCrosses;

    })(Marker.Collection);
    return {
      Model: SquareCross,
      View: SquareCrossView,
      Collection: new SquareCrosses()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=square_cross.js.map
*/