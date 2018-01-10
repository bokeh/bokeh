import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as p from "core/properties"
;

export class RayView extends XYGlyphView {

  _map_data() {
    if (this.model.properties.length.units === "data") {
      return this.slength = this.sdist(this.renderer.xscale, this._x, this._length);
    } else {
      return this.slength = this._length;
    }
  }

  _render(ctx, indices, {sx, sy, slength, _angle}) {
    if (this.visuals.line.doit) {

      let i;
      let asc, end;
      const width = this.renderer.plot_view.frame._width.value;
      const height = this.renderer.plot_view.frame._height.value;
      const inf_len = 2 * (width + height);
      for (i = 0, end = slength.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        if (slength[i] === 0) {
          slength[i] = inf_len;
        }
      }

      for (i of indices) {
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

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export class Ray extends XYGlyph {
  static initClass() {
    this.prototype.default_view = RayView;

    this.prototype.type = 'Ray';

    this.mixins(['line']);
    this.define({
      length: [ p.DistanceSpec ],
      angle:  [ p.AngleSpec    ]
    });
  }
}
Ray.initClass();
