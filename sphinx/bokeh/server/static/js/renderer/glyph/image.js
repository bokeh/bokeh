(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "mapper/linear_color_mapper", "./glyph"], function(_, Properties, LinearColorMapper, Glyph) {
    var Image, ImageView, Images, _ref, _ref1, _ref2;
    ImageView = (function(_super) {
      __extends(ImageView, _super);

      function ImageView() {
        _ref = ImageView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ImageView.prototype._properties = [];

      ImageView.prototype.initialize = function(options) {
        if (this.mget("rows") != null) {
          this._fields = ['image:array', 'rows', 'cols', 'x', 'y', 'dw', 'dh', 'palette:string'];
        } else {
          this._fields = ['image:array', 'x', 'y', 'dw', 'dh', 'palette:string'];
        }
        return ImageView.__super__.initialize.call(this, options);
      };

      ImageView.prototype._set_data = function() {
        var buf, buf8, canvas, cmap, ctx, i, image_data, img, _i, _ref1, _results;
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
          cmap = this.mget('color_mapper');
          if (this.rows != null) {
            img = this.image[i];
          } else {
            img = _.flatten(this.image[i]);
          }
          buf = cmap.v_map_screen(img);
          buf8 = new Uint8ClampedArray(buf);
          image_data.data.set(buf8);
          ctx.putImageData(image_data, 0, 0);
          _results.push(this.image_data[i] = canvas);
        }
        return _results;
      };

      ImageView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'dw', 'edge', this.mget('dilate'));
        return this.sh = this.distance_vector('y', 'dh', 'edge', this.mget('dilate'));
      };

      ImageView.prototype._render = function(ctx, indices) {
        var i, old_smoothing, y_offset, _i, _len;
        old_smoothing = ctx.getImageSmoothingEnabled();
        ctx.setImageSmoothingEnabled(false);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (this.image_data[i] == null) {
            continue;
          }
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

      return ImageView;

    })(Glyph.View);
    Image = (function(_super) {
      __extends(Image, _super);

      function Image() {
        _ref1 = Image.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Image.prototype.default_view = ImageView;

      Image.prototype.type = 'Image';

      Image.prototype.display_defaults = function() {
        return _.extend({}, Image.__super__.display_defaults.call(this), {
          level: 'underlay',
          dilate: false
        });
      };

      return Image;

    })(Glyph.Model);
    Images = (function(_super) {
      __extends(Images, _super);

      function Images() {
        _ref2 = Images.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Images.prototype.model = Image;

      return Images;

    })(Glyph.Collection);
    return {
      Model: Image,
      View: ImageView,
      Collection: new Images()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=image.js.map
*/