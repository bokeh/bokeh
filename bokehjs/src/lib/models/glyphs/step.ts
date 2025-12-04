import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {generic_line_scalar_legend} from "./utils"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Rect} from "core/types"
import {StepMode} from "core/enums"
import type {Context2d} from "core/util/canvas"
import {unreachable} from "core/util/assert"
import type {StepGL} from "./webgl/step"

export interface StepView extends Step.Data {}

export class StepView extends XYGlyphView {
  declare model: Step
  declare visuals: Step.Visuals

  /** @internal */
  declare glglyph?: StepGL

  override async load_glglyph() {
    const {StepGL} = await import("./webgl/step")
    return StepGL
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Step.Data>): void {
    const npoints = indices.length
    if (npoints < 2) {
      return
    }

    let indices_consecutive: number[] = []

    for (let i = 0; i < indices.length; i++) {
      if (i == 0) {
        indices_consecutive.push(indices[i])
      } else if ((indices[i]-1) != indices[i-1]) {
        this._paint_consecutive(ctx, indices_consecutive, data)
        indices_consecutive = [indices[i]]
      } else {
        indices_consecutive.push(indices[i])
        if (i+1 == indices.length) {
          this._paint_consecutive(ctx, indices_consecutive, data)
        }
      }
    }
  }

  protected _paint_consecutive(ctx: Context2d, indices: number[], data?: Partial<Step.Data>): void {
    const {sx, sy} = {...this, ...data}
    const mode = this.model.mode
    const pad_before = this.model.pad_before
    const pad_after = this.model.pad_after

    this.visuals.line.set_value(ctx)

    let drawing = false
    let prev_finite = false
    const first_i = indices[0]
    const last_i = indices[indices.length - 1]
    let is_finite = isFinite(sx[first_i] + sy[first_i])

    // Calculate step width for padding (use first step width as reference)
    let step_width = 0
    if (indices.length > 1 && isFinite(sx[first_i]) && isFinite(sx[first_i + 1])) {
      step_width = sx[first_i + 1] - sx[first_i]
    }

    // Handle pad_before for mode "before" and "after"
    if (pad_before > 0 && is_finite && step_width != 0) {
      switch (mode) {
        case "before":
          drawing = this._render_xy(ctx, drawing, sx[first_i] - pad_before * step_width, sy[first_i])
          break
        case "after":
          drawing = this._render_xy(ctx, drawing, sx[first_i] - pad_before * step_width, sy[first_i])
          break
        case "center":
          drawing = this._render_xy(ctx, drawing, sx[first_i] - pad_before * step_width, sy[first_i])
          break
      }
    }

    if (mode == "center" && pad_before == 0) {
      drawing = this._render_xy(ctx, drawing, is_finite ? sx[first_i] : NaN, sy[first_i])
    }

    for (let k = 0; k < indices.length; k++) {
      const i = indices[k]
      const next_finite = isFinite(sx[i+1] + sy[i+1]) && indices[k+1] == i+1
      switch (mode) {
        case "before":
          drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
          if (i < sx.length-1) {
            drawing = this._render_xy(ctx, drawing, is_finite && next_finite ? sx[i] : NaN, sy[i+1])
          }
          break
        case "after":
          drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
          if (i < sx.length-1) {
            drawing = this._render_xy(ctx, drawing, is_finite && next_finite ? sx[i+1] : NaN, sy[i])
          }
          break
        case "center":
          if (is_finite && next_finite) {
            const midx = (sx[i] + sx[i+1])/2
            drawing = this._render_xy(ctx, drawing, midx, sy[i])
            drawing = this._render_xy(ctx, drawing, midx, sy[i+1])
          } else {
            if (prev_finite) {
              drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
            }
            drawing = this._render_xy(ctx, drawing, next_finite ? sx[i+1] : NaN, sy[i+1])
          }
          break
        default:
          unreachable()
      }
      prev_finite = is_finite
      is_finite = next_finite
    }

    // Draw the final point and handle pad_after
    if (drawing) {
      const i = last_i
      const last_finite = isFinite(sx[i] + sy[i])

      // Calculate step width for pad_after (use last step width as reference)
      let last_step_width = step_width
      if (indices.length > 1 && isFinite(sx[i]) && isFinite(sx[i - 1])) {
        last_step_width = sx[i] - sx[i - 1]
      }

      if (pad_after > 0 && last_finite && last_step_width != 0) {
        switch (mode) {
          case "before":
            this._render_xy(ctx, drawing, sx[i], sy[i])
            this._render_xy(ctx, drawing, sx[i] + pad_after * last_step_width, sy[i])
            break
          case "after":
            this._render_xy(ctx, drawing, sx[i], sy[i])
            this._render_xy(ctx, drawing, sx[i] + pad_after * last_step_width, sy[i])
            break
          case "center":
            this._render_xy(ctx, drawing, sx[i], sy[i])
            this._render_xy(ctx, drawing, sx[i] + pad_after * last_step_width, sy[i])
            break
        }
      } else {
        this._render_xy(ctx, drawing, last_finite ? sx[i] : NaN, sy[i])
      }
      ctx.stroke()
    }
  }

  protected _render_xy(ctx: Context2d, drawing: boolean, x: number, y: number): boolean {
    if (isFinite(x + y)) {
      if (drawing) {
        // Continue with current line
        ctx.lineTo(x, y)
      } else {
        // Start new line
        ctx.beginPath()
        ctx.moveTo(x, y)
        drawing = true
      }
    } else if (drawing) {
      // End current line
      ctx.stroke()
      drawing = false
    }
    return drawing
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_line_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace Step {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    mode: p.Property<StepMode>
    pad_before: p.Property<number>
    pad_after: p.Property<number>
  } & Mixins

  export type Mixins = mixins.LineScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar}

  export type Data = p.GlyphDataOf<Props>
}

export interface Step extends Step.Attrs {}

export class Step extends XYGlyph {
  declare properties: Step.Props
  declare __view_type__: StepView

  constructor(attrs?: Partial<Step.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = StepView

    this.mixins<Step.Mixins>(mixins.LineScalar)
    this.define<Step.Props>(({Float}) => ({
      mode: [ StepMode, "before" ],
      pad_before: [ Float, 0 ],
      pad_after: [ Float, 0 ],
    }))
  }
}
