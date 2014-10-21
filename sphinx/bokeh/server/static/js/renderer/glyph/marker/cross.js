(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var Cross, CrossView, Crosses, _ref, _ref1, _ref2;
    CrossView = (function(_super) {
      __extends(CrossView, _super);

      function CrossView() {
        _ref = CrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CrossView.prototype._properties = ['line'];

      CrossView.prototype._render = function(ctx, indices, sx, sy, size) {
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
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.moveTo(sx[i] - r, sy[i]);
          ctx.lineTo(sx[i] + r, sy[i]);
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return CrossView;

    })(Marker.View);
    Cross = (function(_super) {
      __extends(Cross, _super);

      function Cross() {
        _ref1 = Cross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Cross.prototype.default_view = CrossView;

      Cross.prototype.type = 'Cross';

      Cross.prototype.display_defaults = function() {
        return _.extend({}, Cross.__super__.display_defaults.call(this), this.line_defaults);
      };

      return Cross;

    })(Marker.Model);
    Crosses = (function(_super) {
      __extends(Crosses, _super);

      function Crosses() {
        _ref2 = Crosses.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Crosses.prototype.model = Cross;

      return Crosses;

    })(Marker.Collection);
    return {
      Model: Cross,
      View: CrossView,
      Collection: new Crosses()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=cross.js.map
*/