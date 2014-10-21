(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var ImageURL, ImageURLView, ImageURLs, _ref, _ref1, _ref2;
    ImageURLView = (function(_super) {
      __extends(ImageURLView, _super);

      function ImageURLView() {
        _ref = ImageURLView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ImageURLView.prototype._fields = ['url:string', 'x', 'y', 'w', 'h', 'angle'];

      ImageURLView.prototype._properties = [];

      ImageURLView.prototype._set_data = function() {
        var img;
        this.image = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.url;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            img = _ref1[_i];
            _results.push(null);
          }
          return _results;
        }).call(this);
        this.need_load = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.url;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            img = _ref1[_i];
            _results.push(true);
          }
          return _results;
        }).call(this);
        return this.loaded = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.url;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            img = _ref1[_i];
            _results.push(false);
          }
          return _results;
        }).call(this);
      };

      ImageURLView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.renderer.map_to_screen(this.x, this.glyph.x.units, this.y, this.glyph.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'w', 'edge', this.mget('dilate'));
        return this.sh = this.distance_vector('y', 'h', 'edge', this.mget('dilate'));
      };

      ImageURLView.prototype._render = function(ctx, indices) {
        var i, img, _i, _len, _results,
          _this = this;
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
            continue;
          }
          if (this.need_load[i]) {
            img = new Image();
            img.onload = (function(img, i) {
              return function() {
                var frame;
                _this.loaded[i] = true;
                _this.image[i] = img;
                ctx.save();
                ctx.beginPath();
                frame = _this.renderer.plot_view.frame;
                ctx.rect(frame.get('left') + 1, frame.get('bottom') + 1, frame.get('width') - 2, frame.get('height') - 2);
                ctx.clip();
                _this._render_image(ctx, i, img);
                return ctx.restore();
              };
            })(img, i);
            img.src = this.url[i];
            _results.push(this.need_load[i] = false);
          } else if (this.loaded[i]) {
            _results.push(this._render_image(ctx, i, this.image[i]));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      ImageURLView.prototype._final_sx_sy = function() {
        var anchor,
          _this = this;
        anchor = this.mget('anchor') || "top_left";
        switch (anchor) {
          case "top_left":
            return function(i) {
              return [_this.sx[i], _this.sy[i]];
            };
          case "top_center":
            return function(i) {
              return [_this.sx[i] - _this.sw[i] / 2, _this.sy[i]];
            };
          case "top_right":
            return function(i) {
              return [_this.sx[i] - _this.sw[i], _this.sy[i]];
            };
          case "right_center":
            return function(i) {
              return [_this.sx[i] - _this.sw[i], _this.sy[i] - _this.sh[i] / 2];
            };
          case "bottom_right":
            return function(i) {
              return [_this.sx[i] - _this.sw[i], _this.sy[i] - _this.sh[i]];
            };
          case "bottom_center":
            return function(i) {
              return [_this.sx[i] - _this.sw[i] / 2, _this.sy[i] - _this.sh[i]];
            };
          case "bottom_left":
            return function(i) {
              return [_this.sx[i], _this.sy[i] - _this.sh[i]];
            };
          case "left_center":
            return function(i) {
              return [_this.sx[i], _this.sy[i] - _this.sh[i] / 2];
            };
          case "center":
            return function(i) {
              return [_this.sx[i] - _this.sw[i] / 2, _this.sy[i] - _this.sh[i] / 2];
            };
        }
      };

      ImageURLView.prototype._render_image = function(ctx, i, img) {
        var sx, sy, _ref1;
        if (isNaN(this.sw[i])) {
          this.sw[i] = img.width;
        }
        if (isNaN(this.sh[i])) {
          this.sh[i] = img.height;
        }
        _ref1 = this._final_sx_sy()(i), sx = _ref1[0], sy = _ref1[1];
        if (this.angle[i]) {
          ctx.translate(sx, sy);
          ctx.rotate(this.angle[i]);
          ctx.drawImage(img, 0, 0, this.sw[i], this.sh[i]);
          ctx.rotate(-this.angle[i]);
          return ctx.translate(-sx, -sy);
        } else {
          return ctx.drawImage(img, sx, sy, this.sw[i], this.sh[i]);
        }
      };

      return ImageURLView;

    })(Glyph.View);
    ImageURL = (function(_super) {
      __extends(ImageURL, _super);

      function ImageURL() {
        _ref1 = ImageURL.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ImageURL.prototype.default_view = ImageURLView;

      ImageURL.prototype.type = 'ImageURL';

      ImageURL.prototype.display_defaults = function() {
        return _.extend({}, ImageURL.__super__.display_defaults.call(this), {
          level: 'underlay'
        });
      };

      return ImageURL;

    })(Glyph.Model);
    ImageURLs = (function(_super) {
      __extends(ImageURLs, _super);

      function ImageURLs() {
        _ref2 = ImageURLs.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ImageURLs.prototype.model = ImageURL;

      return ImageURLs;

    })(Glyph.Collection);
    return {
      Model: ImageURL,
      View: ImageURLView,
      Collection: new ImageURLs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=image_url.js.map
*/