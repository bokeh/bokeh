(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Segment, SegmentView, Segments, _ref, _ref1, _ref2;
    SegmentView = (function(_super) {
      __extends(SegmentView, _super);

      function SegmentView() {
        _ref = SegmentView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SegmentView.prototype._fields = ['x0', 'y0', 'x1', 'y1'];

      SegmentView.prototype._properties = ['line'];

      SegmentView.prototype._map_data = function() {
        var _ref1, _ref2;
        _ref1 = this.renderer.map_to_screen(this.x0, this.glyph.x0.units, this.y0, this.glyph.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
        return _ref2 = this.renderer.map_to_screen(this.x1, this.glyph.x1.units, this.y1, this.glyph.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1], _ref2;
      };

      SegmentView.prototype._render = function(ctx, indices) {
        var i, _i, _len, _results;
        if (this.props.line.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i])) {
              continue;
            }
            ctx.beginPath();
            ctx.moveTo(this.sx0[i], this.sy0[i]);
            ctx.lineTo(this.sx1[i], this.sy1[i]);
            this.props.line.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          }
          return _results;
        }
      };

      SegmentView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return SegmentView;

    })(Glyph.View);
    Segment = (function(_super) {
      __extends(Segment, _super);

      function Segment() {
        _ref1 = Segment.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Segment.prototype.default_view = SegmentView;

      Segment.prototype.type = 'Segment';

      Segment.prototype.display_defaults = function() {
        return _.extend({}, Segment.__super__.display_defaults.call(this), this.line_defaults);
      };

      return Segment;

    })(Glyph.Model);
    Segments = (function(_super) {
      __extends(Segments, _super);

      function Segments() {
        _ref2 = Segments.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Segments.prototype.model = Segment;

      return Segments;

    })(Glyph.Collection);
    return {
      Model: Segment,
      View: SegmentView,
      Collection: new Segments()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=segment.js.map
*/