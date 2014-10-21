(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "rbush", "../glyph"], function(_, rbush, Glyph) {
    var Marker, MarkerView, Markers, _ref, _ref1, _ref2;
    MarkerView = (function(_super) {
      __extends(MarkerView, _super);

      function MarkerView() {
        _ref = MarkerView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MarkerView.prototype._fields = ['x', 'y', 'size'];

      MarkerView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, reference_point, size, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        size = {};
        size[reference_point] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.4;
        return this._render(ctx, indices, this.props, sx, sy, size);
      };

      MarkerView.prototype._set_data = function() {
        var i, pts, _i, _ref1;
        this.max_size = _.max(this.size);
        this.index = rbush();
        pts = [];
        for (i = _i = 0, _ref1 = this.x.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (!isNaN(this.x[i] + this.y[i])) {
            pts.push([
              this.x[i], this.y[i], this.x[i], this.y[i], {
                'i': i
              }
            ]);
          }
        }
        return this.index.load(pts);
      };

      MarkerView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      MarkerView.prototype._mask_data = function() {
        var hr, vr, vx0, vx1, vy0, vy1, x, x0, x1, y0, y1, _ref1, _ref2;
        hr = this.renderer.plot_view.frame.get('h_range');
        vx0 = hr.get('start') - this.max_size;
        vx1 = hr.get('end') + this.max_size;
        _ref1 = this.renderer.xmapper.v_map_from_target([vx0, vx1]), x0 = _ref1[0], x1 = _ref1[1];
        vr = this.renderer.plot_view.frame.get('v_range');
        vy0 = vr.get('start') - this.max_size;
        vy1 = vr.get('end') + this.max_size;
        _ref2 = this.renderer.ymapper.v_map_from_target([vy0, vy1]), y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      MarkerView.prototype._hit_point = function(geometry) {
        var candidates, dist, hits, i, s2, sx, sy, vx, vx0, vx1, vy, vy0, vy1, x, x0, x1, y0, y1, _i, _len, _ref1, _ref2, _ref3;
        _ref1 = [geometry.vx, geometry.vy], vx = _ref1[0], vy = _ref1[1];
        sx = this.renderer.plot_view.canvas.vx_to_sx(vx);
        sy = this.renderer.plot_view.canvas.vy_to_sy(vy);
        vx0 = vx - this.max_size;
        vx1 = vx + this.max_size;
        _ref2 = this.renderer.xmapper.v_map_from_target([vx0, vx1]), x0 = _ref2[0], x1 = _ref2[1];
        vy0 = vy - this.max_size;
        vy1 = vy + this.max_size;
        _ref3 = this.renderer.ymapper.v_map_from_target([vy0, vy1]), y0 = _ref3[0], y1 = _ref3[1];
        candidates = (function() {
          var _i, _len, _ref4, _results;
          _ref4 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            x = _ref4[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
        hits = [];
        for (_i = 0, _len = candidates.length; _i < _len; _i++) {
          i = candidates[_i];
          s2 = this.size[i] / 2;
          dist = Math.abs(this.sx[i] - sx) + Math.abs(this.sy[i] - sy);
          if (Math.abs(this.sx[i] - sx) <= s2 && Math.abs(this.sy[i] - sy) <= s2) {
            hits.push([i, dist]);
          }
        }
        hits = _.chain(hits).sortBy(function(elt) {
          return elt[1];
        }).map(function(elt) {
          return elt[0];
        }).value();
        return hits;
      };

      MarkerView.prototype._hit_rect = function(geometry) {
        var x, x0, x1, y0, y1, _ref1, _ref2;
        _ref1 = this.renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1]), x0 = _ref1[0], x1 = _ref1[1];
        _ref2 = this.renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1]), y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      return MarkerView;

    })(Glyph.View);
    Marker = (function(_super) {
      __extends(Marker, _super);

      function Marker() {
        _ref1 = Marker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Marker.prototype.display_defaults = function() {
        return _.extend({}, Marker.__super__.display_defaults.call(this), {
          size: 4
        });
      };

      return Marker;

    })(Glyph.Model);
    Markers = (function(_super) {
      __extends(Markers, _super);

      function Markers() {
        _ref2 = Markers.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      return Markers;

    })(Glyph.Collection);
    return {
      Model: Marker,
      View: MarkerView,
      Collection: Markers
    };
  });

}).call(this);

/*
//@ sourceMappingURL=marker.js.map
*/