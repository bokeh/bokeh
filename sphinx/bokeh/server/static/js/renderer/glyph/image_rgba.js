(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var ImageRGBA, ImageRGBAView, ImageRGBAs, _ref, _ref1, _ref2;
    ImageRGBAView = (function(_super) {
      __extends(ImageRGBAView, _super);

      function ImageRGBAView() {
        _ref = ImageRGBAView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ImageRGBAView.prototype._properties = [];

      ImageRGBAView.prototype.initialize = function(options) {
        if (this.mget("rows") != null) {
          this._fields = ['image:array', 'rows', 'cols', 'x', 'y', 'dw', 'dh'];
        } else {
          this._fields = ['image:array', 'x', 'y', 'dw', 'dh'];
        }
        return ImageRGBAView.__super__.initialize.call(this, options);
      };

      ImageRGBAView.prototype._set_data = function() {
        var buf, buf8, canvas, color, ctx, flat, i, image_data, j, _i, _j, _ref1, _ref2, _results;
        if ((this.image_data == null) || this.image_data.length !== this.image.length) {
          this.image_data = new Array(this.image.length);
        }
        if ((this.width == null) || this.width.length !== this.image.length) {
          this.width = new Array(this.image.length);
        }
        if ((this.height == null) || this.height.length !== this.image.length) {
          this.height = new Array(this.image.length);
        }
        _results = [];
        for (i = _i = 0, _ref1 = this.image.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (this.rows != null) {
            this.height[i] = this.rows[i];
            this.width[i] = this.cols[i];
          } else {
            this.height[i] = this.image[i].length;
            this.width[i] = this.image[i][0].length;
          }
          canvas = document.createElement('canvas');
          canvas.width = this.width[i];
          canvas.height = this.height[i];
          ctx = canvas.getContext('2d');
          image_data = ctx.getImageData(0, 0, this.width[i], this.height[i]);
          if (this.rows != null) {
            image_data.data.set(new Uint8ClampedArray(this.image[i]));
          } else {
            flat = _.flatten(this.image[i]);
            buf = new ArrayBuffer(flat.length * 4);
            color = new Uint32Array(buf);
            for (j = _j = 0, _ref2 = flat.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
              color[j] = flat[j];
            }
            buf8 = new Uint8ClampedArray(buf);
            image_data.data.set(buf8);
          }
          ctx.putImageData(image_data, 0, 0);
          _results.push(this.image_data[i] = canvas);
        }
        return _results;
      };

      ImageRGBAView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'dw', 'edge', this.mget('dilate'));
        return this.sh = this.distance_vector('y', 'dh', 'edge', this.mget('dilate'));
      };

      ImageRGBAView.prototype._render = function(ctx, indices) {
        var i, old_smoothing, y_offset, _i, _len;
        old_smoothing = ctx.getImageSmoothingEnabled();
        ctx.setImageSmoothingEnabled(false);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i])) {
            continue;
          }
          y_offset = this.sy[i];
          ctx.translate(0, y_offset);
          ctx.scale(1, -1);
          ctx.translate(0, -y_offset);
          ctx.drawImage(this.image_data[i], this.sx[i] | 0, this.sy[i] | 0, this.sw[i], this.sh[i]);
          ctx.translate(0, y_offset);
          ctx.scale(1, -1);
          ctx.translate(0, -y_offset);
        }
        return ctx.setImageSmoothingEnabled(old_smoothing);
      };

      return ImageRGBAView;

    })(Glyph.View);
    ImageRGBA = (function(_super) {
      __extends(ImageRGBA, _super);

      function ImageRGBA() {
        _ref1 = ImageRGBA.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ImageRGBA.prototype.default_view = ImageRGBAView;

      ImageRGBA.prototype.type = 'ImageRGBA';

      ImageRGBA.prototype.display_defaults = function() {
        return _.extend({}, ImageRGBA.__super__.display_defaults.call(this), {
          level: 'underlay',
          dilate: false
        });
      };

      return ImageRGBA;

    })(Glyph.Model);
    ImageRGBAs = (function(_super) {
      __extends(ImageRGBAs, _super);

      function ImageRGBAs() {
        _ref2 = ImageRGBAs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ImageRGBAs.prototype.model = ImageRGBA;

      return ImageRGBAs;

    })(Glyph.Collection);
    return {
      Model: ImageRGBA,
      View: ImageRGBAView,
      Collection: new ImageRGBAs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=image_rgba.js.map
*/