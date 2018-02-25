/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec, NumberSpec} from "core/vectorization"
import {ColorMapper} from "../mappers/color_mapper";
import {LinearColorMapper} from "../mappers/linear_color_mapper";
import * as p from "core/properties";
import {max, concat} from "core/util/array"
import {Context2d} from "core/util/canvas"

export class ImageView extends XYGlyphView {
  model: Image

  initialize(options: any): void {
    super.initialize(options);
    this.connect(this.model.color_mapper.change, function() { return this._update_image(); });
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render());
  }

  _update_image() {
    // Only reset image_data if already initialized
    if (this.image_data != null) {
      this._set_data();
      return this.renderer.plot_view.request_render();
    }
  }

  _set_data() {
    if ((this.image_data == null) || (this.image_data.length !== this._image.length)) {
      this.image_data = new Array(this._image.length);
    }

    if ((this._width == null) || (this._width.length !== this._image.length)) {
      this._width = new Array(this._image.length);
    }

    if ((this._height == null) || (this._height.length !== this._image.length)) {
      this._height = new Array(this._image.length);
    }

    for (let i = 0, end = this._image.length; i < end; i++) {
      let canvas, img;
      let shape = [];
      if (this._image_shape != null) {
        shape = this._image_shape[i];
      }

      if (shape.length > 0) {
        img = this._image[i];
        this._height[i] = shape[0];
        this._width[i] = shape[1];
      } else {
        img = concat(this._image[i]);
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
      const cmap = this.model.color_mapper;
      const buf = cmap.v_map_screen(img, true);
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

  _render(ctx: Context2d, indices, {image_data, sx, sy, sw, sh}) {
    const old_smoothing = ctx.getImageSmoothingEnabled();
    ctx.setImageSmoothingEnabled(false);

    ctx.globalAlpha = this.model.global_alpha;

    for (const i of indices) {
      if ((image_data[i] == null)) {
        continue;
      }
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

// NOTE: this needs to be redefined here, because palettes are located in bokeh-api.js bundle
const Greys9 = () => [0x000000, 0x252525, 0x525252, 0x737373, 0x969696, 0xbdbdbd, 0xd9d9d9, 0xf0f0f0, 0xffffff];

export namespace Image {
  export interface Attrs extends XYGlyph.Attrs {
    image: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    global_alpha: number
    dilate: boolean
    color_mapper: ColorMapper
  }

  export interface Opts extends XYGlyph.Opts {}
}

export interface Image extends Image.Attrs {}

export class Image extends XYGlyph {

  constructor(attrs?: Partial<Image.Attrs>, opts?: Image.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'Image';
    this.prototype.default_view = ImageView;

    this.define({
      image:        [ p.NumberSpec       ], // TODO (bev) array spec?
      dw:           [ p.DistanceSpec     ],
      dh:           [ p.DistanceSpec     ],
      dilate:       [ p.Bool,      false ],
      global_alpha: [ p.Number,    1.0   ],
      color_mapper: [ p.Instance,  () => new LinearColorMapper({palette: Greys9()}) ],
    });
  }
}
Image.initClass();
