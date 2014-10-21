(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_properties"], function(_, Collection, HasProperties) {
    var LinearColorMapper, LinearColorMappers, _ref, _ref1;
    LinearColorMapper = (function(_super) {
      __extends(LinearColorMapper, _super);

      function LinearColorMapper() {
        _ref = LinearColorMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LinearColorMapper.prototype.initialize = function(attrs, options) {
        LinearColorMapper.__super__.initialize.call(this, attrs, options);
        this.palette = this._build_palette(this.get('palette'));
        this.little_endian = this._is_little_endian();
        if (this.get('reserve_color') != null) {
          this.reserve_color = parseInt(this.get('reserve_color').slice(1), 16);
          return this.reserve_val = this.get('reserve_val');
        }
      };

      LinearColorMapper.prototype.v_map_screen = function(data) {
        var N, buf, color, d, high, i, low, offset, scale, value, _i, _j, _ref1, _ref2, _ref3, _ref4;
        buf = new ArrayBuffer(data.length * 4);
        color = new Uint32Array(buf);
        low = (_ref1 = this.get('low')) != null ? _ref1 : _.min(data);
        high = (_ref2 = this.get('high')) != null ? _ref2 : _.max(data);
        N = this.palette.length - 1;
        scale = N / (high - low);
        offset = -scale * low;
        if (this.little_endian) {
          for (i = _i = 0, _ref3 = data.length; 0 <= _ref3 ? _i < _ref3 : _i > _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
            d = data[i];
            if (d === this.reserve_val) {
              value = this.reserve_color;
            } else {
              if (d > high) {
                d = high;
              }
              if (d < low) {
                d = low;
              }
              value = this.palette[Math.floor(d * scale + offset)];
            }
            color[i] = (0xff << 24) | ((value & 0xff0000) >> 16) | (value & 0xff00) | ((value & 0xff) << 16);
          }
        } else {
          for (i = _j = 0, _ref4 = data.length; 0 <= _ref4 ? _j < _ref4 : _j > _ref4; i = 0 <= _ref4 ? ++_j : --_j) {
            d = data[i];
            if (d === this.reserve_val) {
              value = this.reserve_color;
            } else {
              if (d > high) {
                d = high;
              }
              if (d < low) {
                d = low;
              }
              value = this.palette[Math.floor(d * scale + offset)];
            }
            color[i] = (value << 8) | 0xff;
          }
        }
        return buf;
      };

      LinearColorMapper.prototype._is_little_endian = function() {
        var buf, buf32, buf8, little_endian;
        buf = new ArrayBuffer(4);
        buf8 = new Uint8ClampedArray(buf);
        buf32 = new Uint32Array(buf);
        buf32[1] = 0x0a0b0c0d;
        little_endian = true;
        if (buf8[4] === 0x0a && buf8[5] === 0x0b && buf8[6] === 0x0c && buf8[7] === 0x0d) {
          little_endian = false;
        }
        return little_endian;
      };

      LinearColorMapper.prototype._build_palette = function(palette) {
        var i, new_palette, _i, _ref1;
        new_palette = new Uint32Array(palette.length + 1);
        for (i = _i = 0, _ref1 = palette.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (_.isNumber(palette[i])) {
            new_palette[i] = palette[i];
          } else {
            new_palette[i] = parseInt(palette[i].slice(1), 16);
          }
        }
        new_palette[new_palette.length - 1] = palette[palette.length - 1];
        return new_palette;
      };

      return LinearColorMapper;

    })(HasProperties);
    LinearColorMappers = (function(_super) {
      __extends(LinearColorMappers, _super);

      function LinearColorMappers() {
        _ref1 = LinearColorMappers.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LinearColorMappers.prototype.model = LinearColorMapper;

      return LinearColorMappers;

    })(Collection);
    return {
      "Model": LinearColorMapper,
      "Collection": new LinearColorMappers()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=linear_color_mapper.js.map
*/