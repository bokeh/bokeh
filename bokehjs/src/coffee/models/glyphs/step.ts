/* XXX: partial */
import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph";
import {LineMixinVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {StepMode} from "core/enums"
import * as p from "core/properties"
import {IBBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"

export interface StepData extends XYGlyphData {
}

export interface StepView extends StepData {}

export class StepView extends XYGlyphView {
  model: Step
  visuals: Step.Visuals

  protected _render(ctx: Context2d, indices: number[], {sx, sy}: StepData): void {
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

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    this._generic_line_legend(ctx, bbox, index);
  }
}

export namespace Step {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    mode: StepMode
  }

  export interface Visuals extends XYGlyph.Visuals {
    line: Line
  }
}

export interface Step extends Step.Attrs {}

export class Step extends XYGlyph {

  constructor(attrs?: Partial<Step.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Step';
    this.prototype.default_view = StepView;

    this.mixins(['line']);
    this.define({
      mode: [ p.StepMode, "before"],
    });
  }
}
Step.initClass();
