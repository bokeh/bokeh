(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var InvertedTriangle, InvertedTriangleView, InvertedTriangles, _ref, _ref1, _ref2;
    InvertedTriangleView = (function(_super) {
      __extends(InvertedTriangleView, _super);

      function InvertedTriangleView() {
        _ref = InvertedTriangleView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      InvertedTriangleView.prototype._properties = ['line', 'fill'];

      InvertedTriangleView.prototype._render = function(ctx, indices, sx, sy, size) {
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
          ctx.moveTo(sx[i] - r, sy[i] - a);
          ctx.lineTo(sx[i] + r, sy[i] - a);
          ctx.lineTo(sx[i], sy[i] - a + h);
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

      return InvertedTriangleView;

    })(Marker.View);
    InvertedTriangle = (function(_super) {
      __extends(InvertedTriangle, _super);

      function InvertedTriangle() {
        _ref1 = InvertedTriangle.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      InvertedTriangle.prototype.default_view = InvertedTriangleView;

      InvertedTriangle.prototype.type = 'InvertedTriangle';

      InvertedTriangle.prototype.display_defaults = function() {
        return _.extend({}, InvertedTriangle.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return InvertedTriangle;

    })(Marker.Model);
    InvertedTriangles = (function(_super) {
      __extends(InvertedTriangles, _super);

      function InvertedTriangles() {
        _ref2 = InvertedTriangles.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      InvertedTriangles.prototype.model = InvertedTriangle;

      return InvertedTriangles;

    })(Marker.Collection);
    return {
      Model: InvertedTriangle,
      View: InvertedTriangleView,
      Collection: new InvertedTriangles()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=inverted_triangle.js.map
*/