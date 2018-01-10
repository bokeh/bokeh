import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as p from "core/properties"
;

export class EllipseView extends XYGlyphView {

  _set_data() {
    this.max_w2 = 0;
    if (this.model.properties.width.units === "data") {
      this.max_w2 = this.max_width/2;
    }
    this.max_h2 = 0;
    if (this.model.properties.height.units === "data") {
      return this.max_h2 = this.max_height/2;
    }
  }

  _map_data() {
    if (this.model.properties.width.units === "data") {
      this.sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center');
    } else {
      this.sw = this._width;
    }
    if (this.model.properties.height.units === "data") {
      return this.sh = this.sdist(this.renderer.yscale, this._y, this._height, 'center');
    } else {
      return this.sh = this._height;
    }
  }

  _render(ctx, indices, {sx, sy, sw, sh}) {
     for (let i of indices) {
       if (isNaN(sx[i]+sy[i]+sw[i]+sh[i]+this._angle[i])) {
         continue;
       }

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

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
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
    return this._render(ctx, indices, data);
  }

  _bounds(bds) {
    return this.max_wh2_bounds(bds);
  }
}

export class Ellipse extends XYGlyph {
  static initClass() {
    this.prototype.default_view = EllipseView;

    this.prototype.type = 'Ellipse';

    this.mixins(['line', 'fill']);
    this.define({
        angle:  [ p.AngleSpec,   0.0 ],
        width:  [ p.DistanceSpec     ],
        height: [ p.DistanceSpec     ]
      });
  }
}
Ellipse.initClass();
