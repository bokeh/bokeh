/* XXX: partial */
import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import * as p from "core/properties"
import {IBBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"

export interface EllipseData extends XYGlyphData {
}

export interface EllipseView extends EllipseData {}

export class EllipseView extends XYGlyphView {
  model: Ellipse
  visuals: Ellipse.Visuals

  protected _set_data(): void {
    this.max_w2 = 0;
    if (this.model.properties.width.units == "data")
      this.max_w2 = this.max_width/2;

    this.max_h2 = 0;
    if (this.model.properties.height.units == "data")
      this.max_h2 = this.max_height/2;
  }

  protected _map_data(): void {
    if (this.model.properties.width.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center');
    else
      this.sw = this._width;

    if (this.model.properties.height.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this._height, 'center');
    else
      this.sh = this._height;
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, sw, sh}: EllipseData): void {
     for (const i of indices) {
       if (isNaN(sx[i] + sy[i] + sw[i] + sh[i] + this._angle[i]))
         continue;

       ctx.beginPath();
       ctx.ellipse(sx[i], sy[i], sw[i]/2.0, sh[i]/2.0, this._angle[i], 0, 2 * Math.PI);

       if (this.visuals.fill.doit) {
         this.visuals.fill.set_vectorize(ctx, i);
         ctx.fill();
       }

       if (this.visuals.line.doit) {
         this.visuals.line.set_vectorize(ctx, i);
         ctx.stroke();
       }
     }
   }

  draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: IBBox, index: number): void {
    const indices = [index];
    const sx = { };
    sx[index] = (x0+x1)/2;
    const sy = { };
    sy[index] = (y0+y1)/2;

    const scale = this.sw[index] / this.sh[index];
    const d = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.8;
    const sw = { };
    const sh = { };
    if (scale > 1) {
      sw[index] = d;
      sh[index] = d/scale;
    } else {
      sw[index] = d*scale;
      sh[index] = d;
    }

    const data = {sx, sy, sw, sh};
    this._render(ctx, indices, data);
  }

  _bounds(bds) {
    return this.max_wh2_bounds(bds);
  }
}

export namespace Ellipse {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    angle: AngleSpec
    width: DistanceSpec
    height: DistanceSpec
  }

  export interface Visuals extends XYGlyph.Visuals {
    line: Line
    fill: Fill
  }
}

export interface Ellipse extends Ellipse.Attrs {}

export class Ellipse extends XYGlyph {

  constructor(attrs?: Partial<Ellipse.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Ellipse';
    this.prototype.default_view = EllipseView;

    this.mixins(['line', 'fill']);
    this.define({
      angle:  [ p.AngleSpec,   0.0 ],
      width:  [ p.DistanceSpec     ],
      height: [ p.DistanceSpec     ],
    });
  }
}
Ellipse.initClass();
