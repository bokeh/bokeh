/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph"

export class PatchView extends XYGlyphView {

  _render(ctx, indices, {sx, sy}) {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx);

      for (const i of indices) {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i]);
          continue;
        } else if (isNaN(sx[i] + sy[i])) {
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          continue;
        } else {
          ctx.lineTo(sx[i], sy[i]);
        }
      }

      ctx.closePath();
      ctx.fill();
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx);

      for (const i of indices) {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i]);
          continue;
        } else if (isNaN(sx[i] + sy[i])) {
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          continue;
        } else {
          ctx.lineTo(sx[i], sy[i]);
        }
      }

      ctx.closePath();
      return ctx.stroke();
    }
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_area_legend(ctx, x0, x1, y0, y1, index);
  }
}

export class Patch extends XYGlyph {
  static initClass() {
    this.prototype.default_view = PatchView;

    this.prototype.type = 'Patch';

    this.mixins(['line', 'fill']);
  }
}
Patch.initClass();
