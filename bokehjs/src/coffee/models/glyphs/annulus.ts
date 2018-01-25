/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec} from "core/vectorization"
import * as hittest from "core/hittest";
import * as p from "core/properties"

export class AnnulusView extends XYGlyphView {
  model: Annulus

  _map_data() {
    if (this.model.properties.inner_radius.units === "data") {
      this.sinner_radius = this.sdist(this.renderer.xscale, this._x, this._inner_radius);
    } else {
      this.sinner_radius = this._inner_radius;
    }
    if (this.model.properties.outer_radius.units === "data") {
      return this.souter_radius = this.sdist(this.renderer.xscale, this._x, this._outer_radius);
    } else {
      return this.souter_radius = this._outer_radius;
    }
  }

  _render(ctx, indices, {sx, sy, sinner_radius, souter_radius}) {
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + sinner_radius[i] + souter_radius[i]))
        continue;

      // Because this visual has a whole in it, it proved "challenging"
      // for some browsers to render if drawn in one go --- i.e. it did not
      // work on IE. If we render in two parts (upper and lower part),
      // it is unambiguous what part should be filled. The line is
      // better drawn in one go though, otherwise the part where the pieces
      // meet will not be fully closed due to aa.

      // Detect Microsoft browser. Might need change for newer versions.
      const isie = ((navigator.userAgent.indexOf('MSIE') >= 0) ||
              (navigator.userAgent.indexOf('Trident') > 0) ||
              (navigator.userAgent.indexOf('Edge') > 0));

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i);
        ctx.beginPath();
        if (isie) {
            // Draw two halves of the donut. Works on IE, but causes an aa line on Safari.
            for (const clockwise of [false, true]) {
            ctx.arc(sx[i], sy[i], sinner_radius[i], 0, Math.PI, clockwise);
            ctx.arc(sx[i], sy[i], souter_radius[i], Math.PI, 0, !clockwise);
            }
        } else {
            // Draw donut in one go. Does not work on iE.
            ctx.arc(sx[i], sy[i], sinner_radius[i], 0, 2 * Math.PI, true);
            ctx.arc(sx[i], sy[i], souter_radius[i], 2 * Math.PI, 0, false);
          }
        ctx.fill();
      }

      if (this.visuals.line.doit) {
          this.visuals.line.set_vectorize(ctx, i);
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], sinner_radius[i], 0, 2*Math.PI);
          ctx.moveTo(sx[i]+souter_radius[i], sy[i]);
          ctx.arc(sx[i], sy[i], souter_radius[i], 0, 2*Math.PI);
          ctx.stroke();
      }
    }
  }

  _hit_point(geometry) {
    const {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const x0 = x - this.max_radius;
    const x1 = x + this.max_radius;

    const y = this.renderer.yscale.invert(sy);
    const y0 = y - this.max_radius;
    const y1 = y + this.max_radius;

    const hits = [];

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    for (const i of this.index.indices(bbox)) {
      const or2 = Math.pow(this.souter_radius[i], 2);
      const ir2 = Math.pow(this.sinner_radius[i], 2);
      const [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i]);
      const [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i]);
      const dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2);
      if ((dist <= or2) && (dist >= ir2)) {
        hits.push([i, dist]);
      }
    }

    return hittest.create_1d_hit_test_result(hits);
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    const indices = [index];
    const sx = { };
    sx[index] = (x0+x1)/2;
    const sy = { };
    sy[index] = (y0+y1)/2;

    const r = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.5;
    const sinner_radius = { };
    sinner_radius[index] = r*0.4;
    const souter_radius = { };
    souter_radius[index] = r*0.8;

    const data = {sx, sy, sinner_radius, souter_radius};

    return this._render(ctx, indices, data);
  }
}

export namespace Annulus {
  export interface Attrs extends XYGlyph.Attrs {
    inner_radius: DistanceSpec
    outer_radius: DistanceSpec
  }
}

export interface Annulus extends XYGlyph, Annulus.Attrs {}

export class Annulus extends XYGlyph {

  static initClass() {
    this.prototype.type = 'Annulus';
    this.prototype.default_view = AnnulusView;

    this.mixins(['line', 'fill']);
    this.define({
      inner_radius: [ p.DistanceSpec ],
      outer_radius: [ p.DistanceSpec ],
    });
  }
}
Annulus.initClass();
