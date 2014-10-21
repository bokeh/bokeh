(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var Square, SquareView, Squares, _ref, _ref1, _ref2;
    SquareView = (function(_super) {
      __extends(SquareView, _super);

      function SquareView() {
        _ref = SquareView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SquareView.prototype._properties = ['line', 'fill'];

      SquareView.prototype._render = function(ctx, indices, sx, sy, size) {
        var i, _i, _len, _results;
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
          }
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      return SquareView;

    })(Marker.View);
    Square = (function(_super) {
      __extends(Square, _super);

      function Square() {
        _ref1 = Square.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Square.prototype.default_view = SquareView;

      Square.prototype.type = 'Square';

      Square.prototype.display_defaults = function() {
        return _.extend({}, Square.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Square;

    })(Marker.Model);
    Squares = (function(_super) {
      __extends(Squares, _super);

      function Squares() {
        _ref2 = Squares.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Squares.prototype.model = Square;

      return Squares;

    })(Marker.Collection);
    return {
      Model: Square,
      View: SquareView,
      Collection: new Squares()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=square.js.map
*/