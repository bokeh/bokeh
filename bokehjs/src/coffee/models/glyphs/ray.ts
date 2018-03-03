/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {LineMixinVector} from "core/property_mixins"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export class RayView extends XYGlyphView {
  model: Ray

  _map_data() {
    if (this.model.properties.length.units === "data") {
      return this.slength = this.sdist(this.renderer.xscale, this._x, this._length);
    } else {
      return this.slength = this._length;
    }
  }

  _render(ctx: Context2d, indices, {sx, sy, slength, _angle}) {
    if (this.visuals.line.doit) {
      const width = this.renderer.plot_view.frame._width.value;
      const height = this.renderer.plot_view.frame._height.value;
      const inf_len = 2 * (width + height);

      for (let i = 0, end = slength.length; i < end; i++) {
        if (slength[i] === 0) {
          slength[i] = inf_len;
        }
      }

      for (const i of indices) {
        if (isNaN(sx[i]+sy[i]+_angle[i]+slength[i])) {
          continue;
        }

        ctx.translate(sx[i], sy[i]);
        ctx.rotate(_angle[i]);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(slength[i], 0);

        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();

        ctx.rotate(-_angle[i]);
        ctx.translate(-sx[i], -sy[i]);
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Ray {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    length: DistanceSpec
    angle: AngleSpec
  }
}

export interface Ray extends Ray.Attrs {}

export class Ray extends XYGlyph {

  constructor(attrs?: Partial<Ray.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Ray';
    this.prototype.default_view = RayView;

    this.mixins(['line']);
    this.define({
      length: [ p.DistanceSpec ],
      angle:  [ p.AngleSpec    ],
    });
  }
}
Ray.initClass();
