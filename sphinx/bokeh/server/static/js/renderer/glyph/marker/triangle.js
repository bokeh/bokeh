(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var Triangle, TriangleView, Triangles, _ref, _ref1, _ref2;
    TriangleView = (function(_super) {
      __extends(TriangleView, _super);

      function TriangleView() {
        _ref = TriangleView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TriangleView.prototype._properties = ['line', 'fill'];

      TriangleView.prototype._render = function(ctx, indices, sx, sy, size) {
        var a, h, i, r, _i, _len, _results;
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
          a = size[i] * Math.sqrt(3) / 6;
          r = size[i] / 2;
          h = size[i] * Math.sqrt(3) / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i] - r, sy[i] + a);
          ctx.lineTo(sx[i] + r, sy[i] + a);
          ctx.lineTo(sx[i], sy[i] + a - h);
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

      return TriangleView;

    })(Marker.View);
    Triangle = (function(_super) {
      __extends(Triangle, _super);

      function Triangle() {
        _ref1 = Triangle.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Triangle.prototype.default_view = TriangleView;

      Triangle.prototype.type = 'Triangle';

      Triangle.prototype.display_defaults = function() {
        return _.extend({}, Triangle.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return Triangle;

    })(Marker.Model);
    Triangles = (function(_super) {
      __extends(Triangles, _super);

      function Triangles() {
        _ref2 = Triangles.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Triangles.prototype.model = Triangle;

      return Triangles;

    })(Marker.Collection);
    return {
      Model: Triangle,
      View: TriangleView,
      Collection: new Triangles()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=triangle.js.map
*/