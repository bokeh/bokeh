(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./marker"], function(_, Marker) {
    var Asterisk, AsteriskView, Asterisks, _ref, _ref1, _ref2;
    AsteriskView = (function(_super) {
      __extends(AsteriskView, _super);

      function AsteriskView() {
        _ref = AsteriskView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AsteriskView.prototype._properties = ['line'];

      AsteriskView.prototype._render = function(ctx, indices, sx, sy, size) {
        var i, r, r2, _i, _len, _results;
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
          r2 = r * 0.65;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i] + r);
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.moveTo(sx[i] - r, sy[i]);
          ctx.lineTo(sx[i] + r, sy[i]);
          ctx.moveTo(sx[i] - r2, sy[i] + r2);
          ctx.lineTo(sx[i] + r2, sy[i] - r2);
          ctx.moveTo(sx[i] - r2, sy[i] - r2);
          ctx.lineTo(sx[i] + r2, sy[i] + r2);
          if (this.props.line.do_stroke) {
            this.props.line.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return AsteriskView;

    })(Marker.View);
    Asterisk = (function(_super) {
      __extends(Asterisk, _super);

      function Asterisk() {
        _ref1 = Asterisk.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Asterisk.prototype.default_view = AsteriskView;

      Asterisk.prototype.type = 'Asterisk';

      Asterisk.prototype.display_defaults = function() {
        return _.extend({}, Asterisk.__super__.display_defaults.call(this), this.line_defaults);
      };

      return Asterisk;

    })(Marker.Model);
    Asterisks = (function(_super) {
      __extends(Asterisks, _super);

      function Asterisks() {
        _ref2 = Asterisks.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Asterisks.prototype.model = Asterisk;

      return Asterisks;

    })(Marker.Collection);
    return {
      Model: Asterisk,
      View: AsteriskView,
      Collection: new Asterisks()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=asterisk.js.map
*/