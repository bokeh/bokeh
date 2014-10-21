(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var CircleX, CircleXView, CircleXs, _ref, _ref1, _ref2;
    CircleXView = (function(_super) {
      __extends(CircleXView, _super);

      function CircleXView() {
        _ref = CircleXView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CircleXView.prototype._properties = ['line', 'fill'];

      CircleXView.prototype._render = function(ctx, indices, sx, sy, size) {
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
          ctx.beginPath();
          r = size[i] / 2;
          ctx.arc(sx[i], sy[i], r, 0, 2 * Math.PI, false);
          if (this.props.fill.do_fill) {
            this.props.fill.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            ctx.moveTo(sx[i] - r, sy[i] + r);
            ctx.lineTo(sx[i] + r, sy[i] - r);
            ctx.moveTo(sx[i] - r, sy[i] - r);
            ctx.lineTo(sx[i] + r, sy[i] + r);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return CircleXView;

    })(Marker.View);
    CircleX = (function(_super) {
      __extends(CircleX, _super);

      function CircleX() {
        _ref1 = CircleX.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CircleX.prototype.default_view = CircleXView;

      CircleX.prototype.type = 'CircleX';

      CircleX.prototype.display_defaults = function() {
        return _.extend({}, CircleX.__super__.display_defaults.call(this), this.line_defaults, this.fill_defaults);
      };

      return CircleX;

    })(Marker.Model);
    CircleXs = (function(_super) {
      __extends(CircleXs, _super);

      function CircleXs() {
        _ref2 = CircleXs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CircleXs.prototype.model = CircleX;

      return CircleXs;

    })(Marker.Collection);
    return {
      Model: CircleX,
      View: CircleXView,
      Collection: new CircleXs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=circle_x.js.map
*/