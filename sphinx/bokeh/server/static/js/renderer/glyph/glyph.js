(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(["underscore", "common/logging", "common/has_parent", "common/collection", "common/continuum_view", "renderer/properties"], function(_, Logging, HasParent, Collection, ContinuumView, properties) {
    var Glyph, GlyphView, Glyphs, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    GlyphView = (function(_super) {
      __extends(GlyphView, _super);

      function GlyphView() {
        _ref = GlyphView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GlyphView.prototype.initialize = function(options) {
        GlyphView.__super__.initialize.call(this, options);
        this.renderer = options.renderer;
        this.glyph = new properties.Glyph(this, this._fields);
        this.props = {};
        if (__indexOf.call(this._properties, 'line') >= 0) {
          this.props.line = new properties.Line(this);
        }
        if (__indexOf.call(this._properties, 'fill') >= 0) {
          this.props.fill = new properties.Fill(this);
        }
        if (__indexOf.call(this._properties, 'text') >= 0) {
          return this.props.text = new properties.Text(this);
        }
      };

      GlyphView.prototype.render = function(ctx, indicies) {
        return this._render(ctx, indicies);
      };

      GlyphView.prototype._map_data = function() {
        return null;
      };

      GlyphView.prototype.update_data = function(source) {
        if ((this.props.fill != null) && this.props.fill.do_fill) {
          this.props.fill.set_prop_cache(source);
        }
        if ((this.props.line != null) && this.props.line.do_stroke) {
          this.props.line.set_prop_cache(source);
        }
        if (this.props.text != null) {
          return this.props.text.set_prop_cache(source);
        }
      };

      GlyphView.prototype.set_data = function(source) {
        var dir, field, i, junk, values, x, _i, _j, _k, _len, _ref1, _ref2, _ref3, _ref4, _results;
        _ref1 = this._fields;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          field = _ref1[_i];
          if (field.indexOf(":") > -1) {
            _ref2 = field.split(":"), field = _ref2[0], junk = _ref2[1];
          }
          this[field] = this.glyph.source_v_select(field, source);
          if (field === "direction") {
            values = new Uint8Array(this.direction.length);
            for (i = _j = 0, _ref3 = this.direction.length; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
              dir = this.direction[i];
              if (dir === 'clock') {
                values[i] = false;
              } else if (dir === 'anticlock') {
                values[i] = true;
              } else {
                values = NaN;
              }
            }
            this.direction = values;
          }
          if (field.indexOf("angle") > -1) {
            this[field] = (function() {
              var _k, _len1, _ref4, _results;
              _ref4 = this[field];
              _results = [];
              for (_k = 0, _len1 = _ref4.length; _k < _len1; _k++) {
                x = _ref4[_k];
                _results.push(-x);
              }
              return _results;
            }).call(this);
          }
        }
        this._set_data();
        return (function() {
          _results = [];
          for (var _k = 0, _ref4 = this[field].length; 0 <= _ref4 ? _k < _ref4 : _k > _ref4; 0 <= _ref4 ? _k++ : _k--){ _results.push(_k); }
          return _results;
        }).apply(this);
      };

      GlyphView.prototype._set_data = function() {
        return null;
      };

      GlyphView.prototype.distance_vector = function(pt, span_prop_name, position, dilate) {
        var d, halfspan, i, local_select, mapper, pt0, pt1, pt_units, ptc, source, span, span_units, spt0, spt1,
          _this = this;
        if (dilate == null) {
          dilate = false;
        }
        " returns an array ";
        pt_units = this.glyph[pt].units;
        span_units = this.glyph[span_prop_name].units;
        if (pt === 'x') {
          mapper = this.renderer.xmapper;
        } else if (pt === 'y') {
          mapper = this.renderer.ymapper;
        }
        source = this.renderer.mget('data_source');
        local_select = function(prop_name) {
          return _this.glyph.source_v_select(prop_name, source);
        };
        span = local_select(span_prop_name);
        if (span_units === 'screen') {
          return span;
        }
        if (position === 'center') {
          halfspan = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = span.length; _i < _len; _i++) {
              d = span[_i];
              _results.push(d / 2);
            }
            return _results;
          })();
          ptc = local_select(pt);
          if (pt_units === 'screen') {
            ptc = mapper.v_map_from_target(ptc);
          }
          if (typeof ptc[0] === 'string') {
            ptc = mapper.v_map_to_target(ptc);
          }
          pt0 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = ptc.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(ptc[i] - halfspan[i]);
            }
            return _results;
          })();
          pt1 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = ptc.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(ptc[i] + halfspan[i]);
            }
            return _results;
          })();
        } else {
          pt0 = local_select(pt);
          if (pt_units === 'screen') {
            pt0 = mapper.v_map_from_target(pt0);
          }
          pt1 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = pt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(pt0[i] + span[i]);
            }
            return _results;
          })();
        }
        spt0 = mapper.v_map_to_target(pt0);
        spt1 = mapper.v_map_to_target(pt1);
        if (dilate) {
          return (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = spt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(Math.ceil(Math.abs(spt1[i] - spt0[i])));
            }
            return _results;
          })();
        } else {
          return (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = spt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(Math.abs(spt1[i] - spt0[i]));
            }
            return _results;
          })();
        }
      };

      GlyphView.prototype.hit_test = function(geometry) {
        var result;
        result = null;
        if (geometry.type === "point") {
          if (this._hit_point != null) {
            result = this._hit_point(geometry);
          } else if (this._point_hit_warned == null) {
            logger.warn("'point' selection not available on " + this.model.type + " renderer");
            this._point_hit_warned = true;
          }
        } else if (geometry.type === "rect") {
          if (this._hit_rect != null) {
            result = this._hit_rect(geometry);
          } else if (this._rect_hit_warned == null) {
            logger.warn("'rect' selection not available on " + this.model.type + " renderer");
            this._rect_hit_warned = true;
          }
        } else {
          logger.error("unrecognized selection geometry type '" + geometry.type + "'");
        }
        return result;
      };

      GlyphView.prototype.get_reference_point = function() {
        var reference_point;
        reference_point = this.mget('reference_point');
        if (_.isNumber(reference_point)) {
          return this.data[reference_point];
        } else {
          return reference_point;
        }
      };

      GlyphView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return null;
      };

      GlyphView.prototype._generic_line_legend = function(ctx, x0, x1, y0, y1) {
        var reference_point, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, (y0 + y1) / 2);
        ctx.lineTo(x1, (y0 + y1) / 2);
        if (this.props.line.do_stroke) {
          this.props.line.set_vectorize(ctx, reference_point);
          ctx.stroke();
        }
        return ctx.restore();
      };

      GlyphView.prototype._generic_area_legend = function(ctx, x0, x1, y0, y1) {
        var dh, dw, h, indices, reference_point, sx0, sx1, sy0, sy1, w, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        w = Math.abs(x1 - x0);
        dw = w * 0.1;
        h = Math.abs(y1 - y0);
        dh = h * 0.1;
        sx0 = x0 + dw;
        sx1 = x1 - dw;
        sy0 = y0 + dh;
        sy1 = y1 - dh;
        if (this.props.fill.do_fill) {
          this.props.fill.set_vectorize(ctx, reference_point);
          ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
        }
        if (this.props.line.do_stroke) {
          ctx.beginPath();
          ctx.rect(sx0, sy0, sx1 - sx0, sy1 - sy0);
          this.props.line.set_vectorize(ctx, reference_point);
          return ctx.stroke();
        }
      };

      return GlyphView;

    })(ContinuumView);
    Glyph = (function(_super) {
      __extends(Glyph, _super);

      function Glyph() {
        _ref1 = Glyph.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Glyph.prototype.fill_defaults = {
        fill_color: 'gray',
        fill_alpha: 1.0
      };

      Glyph.prototype.line_defaults = {
        line_color: 'black',
        line_width: 1,
        line_alpha: 1.0,
        line_join: 'miter',
        line_cap: 'butt',
        line_dash: [],
        line_dash_offset: 0
      };

      Glyph.prototype.defaults = function() {
        return _.extend({}, Glyph.__super__.defaults.call(this), {
          size_units: 'screen',
          radius_units: 'data',
          length_units: 'screen',
          angle_units: 'deg',
          start_angle_units: 'deg',
          end_angle_units: 'deg'
        });
      };

      return Glyph;

    })(HasParent);
    Glyphs = (function(_super) {
      __extends(Glyphs, _super);

      function Glyphs() {
        _ref2 = Glyphs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      return Glyphs;

    })(Collection);
    return {
      Model: Glyph,
      View: GlyphView,
      Collection: Glyphs
    };
  });

}).call(this);

/*
//@ sourceMappingURL=glyph.js.map
*/