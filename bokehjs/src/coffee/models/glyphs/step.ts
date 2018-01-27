/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {StepMode} from "core/enums"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export class StepView extends XYGlyphView {
  model: Step

  _render(ctx: Context2d, indices, {sx, sy}) {
    this.visuals.line.set_value(ctx);

    const L = indices.length;
    if (L < 2) {
      return;
    }

    ctx.beginPath();

    ctx.moveTo(sx[0], sy[0]);

    for (let i = 1, end = L; i < end; i++) {
      let x1, x2, y1, y2;
      switch (this.model.mode) {
        case "before": {
          [x1, y1] = [sx[i-1], sy[i]];
          [x2, y2] = [sx[i],   sy[i]];
          break;
        }
        case "after": {
          [x1, y1] = [sx[i], sy[i-1]];
          [x2, y2] = [sx[i], sy[i]  ];
          break;
        }
        case "center": {
          const xm = (sx[i-1] + sx[i])/2;
          [x1, y1] = [xm, sy[i-1]];
          [x2, y2] = [xm, sy[i]  ];
          break;
        }
      }

      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }

    ctx.lineTo(sx[L-1], sy[L-1]);

    return ctx.stroke();
  }

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Step {
  export interface Attrs extends XYGlyph.Attrs {
    mode: StepMode
  }
}

export interface Step extends Step.Attrs {}

export class Step extends XYGlyph {

  static initClass() {
    this.prototype.type = 'Step';
    this.prototype.default_view = StepView;

    this.mixins(['line']);
    this.define({
      mode: [ p.StepMode, "before"],
    });
  }
}
Step.initClass();
