import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as p from "core/properties";
import {max, concat} from "core/util/array"
;

export class ImageRGBAView extends XYGlyphView {

  _set_data(source, indices) {
    if ((this.image_data == null) || (this.image_data.length !== this._image.length)) {
      this.image_data = new Array(this._image.length);
    }

    if ((this._width == null) || (this._width.length !== this._image.length)) {
      this._width = new Array(this._image.length);
    }

    if ((this._height == null) || (this._height.length !== this._image.length)) {
      this._height = new Array(this._image.length);
    }

    for (let i = 0, end = this._image.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      let buf, canvas;
      if ((indices != null) && (indices.indexOf(i) < 0)) {
        continue;
      }

      let shape = [];
      if (this._image_shape != null) {
        shape = this._image_shape[i];
      }

      if (shape.length > 0) {
        buf = this._image[i].buffer;
        this._height[i] = shape[0];
        this._width[i] = shape[1];
      } else {
        const flat = concat(this._image[i]);
        buf = new ArrayBuffer(flat.length * 4);
        const color = new Uint32Array(buf);
        for (let j = 0, end1 = flat.length, asc1 = 0 <= end1; asc1 ? j < end1 : j > end1; asc1 ? j++ : j--) {
          color[j] = flat[j];
        }
        this._height[i] = this._image[i].length;
        this._width[i] = this._image[i][0].length;
      }

      if ((this.image_data[i] != null) && (this.image_data[i].width === this._width[i]) && (this.image_data[i].height === this._height[i])) {
        canvas = this.image_data[i];
      } else {
        canvas = document.createElement('canvas');
        canvas.width = this._width[i];
        canvas.height = this._height[i];
      }
      const ctx = canvas.getContext('2d');
      const image_data = ctx.getImageData(0, 0, this._width[i], this._height[i]);
      const buf8 = new Uint8Array(buf);
      image_data.data.set(buf8);
      ctx.putImageData(image_data, 0, 0);
      this.image_data[i] = canvas;

      this.max_dw = 0;
      if (this._dw.units === "data") {
        this.max_dw = max(this._dw);
      }
      this.max_dh = 0;
      if (this._dh.units === "data") {
        this.max_dh = max(this._dh);
      }
    }
  }

  _map_data() {
    switch (this.model.properties.dw.units) {
      case "data": this.sw = this.sdist(this.renderer.xscale, this._x, this._dw, 'edge', this.model.dilate); break;
      case "screen": this.sw = this._dw; break;
    }

    switch (this.model.properties.dh.units) {
      case "data": return this.sh = this.sdist(this.renderer.yscale, this._y, this._dh, 'edge', this.model.dilate);
      case "screen": return this.sh = this._dh;
    }
  }

  _render(ctx, indices, {image_data, sx, sy, sw, sh}) {
    const old_smoothing = ctx.getImageSmoothingEnabled();
    ctx.setImageSmoothingEnabled(false);

    for (let i of indices) {

      if (isNaN(sx[i]+sy[i]+sw[i]+sh[i])) {
        continue;
      }

      const y_offset = sy[i];

      ctx.translate(0, y_offset);
      ctx.scale(1, -1);
      ctx.translate(0, -y_offset);
      ctx.drawImage(image_data[i], sx[i]|0, sy[i]|0, sw[i], sh[i]);
      ctx.translate(0, y_offset);
      ctx.scale(1, -1);
      ctx.translate(0, -y_offset);
    }

    return ctx.setImageSmoothingEnabled(old_smoothing);
  }

  bounds() {
    const { bbox } = this.index;
    bbox.maxX += this.max_dw;
    bbox.maxY += this.max_dh;
    return bbox;
  }
}

export class ImageRGBA extends XYGlyph {
  static initClass() {
    this.prototype.default_view = ImageRGBAView;

    this.prototype.type = 'ImageRGBA';

    this.define({
        image:  [ p.NumberSpec       ], // TODO (bev) array spec?
        dw:     [ p.DistanceSpec     ],
        dh:     [ p.DistanceSpec     ],
        dilate: [ p.Bool,      false ]
    });
  }
}
ImageRGBA.initClass();
