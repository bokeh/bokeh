(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var SquareX, SquareXView, SquareXs, _ref, _ref1, _ref2;
    SquareXView = (function(_super) {
      __extends(SquareXView, _super);

      function SquareXView() {
        _ref = SquareXView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SquareXView.prototype._properties = ['line', 'fill'];

      SquareXView.prototype._render = function(ctx, indices, sx, sy, size) {
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
            ctx.stroke();
            r = size[i] / 2;
            ctx.moveTo(-r, +r);
            ctx.lineTo(+r, -r);
            ctx.moveTo(-r, -r);
            ctx.lineTo(+r, +r);
            ctx.stroke();
          }
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      return SquareXView;

    })(Marker.View);
    SquareX = (function(_super) {
      __extends(SquareX, _super);

      function SquareX() {
        _ref1 = SquareX.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      SquareX.prototype.default_view = SquareXView;

      SquareX.prototype.type = 'SquareX';

      SquareX.prototype.display_defaults = function() {
        return _.extend({}, SquareX.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return SquareX;

    })(Marker.Model);
    SquareXs = (function(_super) {
      __extends(SquareXs, _super);

      function SquareXs() {
        _ref2 = SquareXs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      SquareXs.prototype.model = SquareX;

      return SquareXs;

    })(Marker.Collection);
    return {
      Model: SquareX,
      View: SquareXView,
      Collection: new SquareXs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=square_x.js.map
*/