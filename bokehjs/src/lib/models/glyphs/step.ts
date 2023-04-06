import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_scalar_legend} from "./utils"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Rect} from "core/types"
import {StepMode} from "core/enums"
import {Context2d} from "core/util/canvas"
import {unreachable} from "core/util/assert"

export type StepData = XYGlyphData

export interface StepView extends StepData {}

export class StepView extends XYGlyphView {
  declare model: Step
  declare visuals: Step.Visuals

  /** @internal */
  declare glglyph?: import("./webgl/step").StepGL

  override async load_glglyph() {
    const {StepGL} = await import("./webgl/step")
    return StepGL
  }

  protected _render(ctx: Context2d, indices: number[], data?: StepData): void {
    const npoints = indices.length
    if (npoints < 2)
      return

    const {sx, sy} = data ?? this
    const mode = this.model.mode

    this.visuals.line.set_value(ctx)

    let drawing = false
    let prev_finite = false
    const i = indices[0]
    let is_finite = isFinite(sx[i] + sy[i])
    if (mode == "center")
      drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])

    for (const i of indices) {
      const next_finite = isFinite(sx[i+1] + sy[i+1])
      switch (mode) {
        case "before":
          drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
          if (i < sx.length-1)
            drawing = this._render_xy(ctx, drawing, is_finite && next_finite ? sx[i] : NaN, sy[i+1])
          break
        case "after":
          drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
          if (i < sx.length-1)
            drawing = this._render_xy(ctx, drawing, is_finite && next_finite ? sx[i+1] : NaN, sy[i])
          break
        case "center":
          if (is_finite && next_finite) {
            const midx = (sx[i] + sx[i+1])/2
            drawing = this._render_xy(ctx, drawing, midx, sy[i])
            drawing = this._render_xy(ctx, drawing, midx, sy[i+1])
          } else {
            if (prev_finite)
              drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
            drawing = this._render_xy(ctx, drawing, next_finite ? sx[i+1] : NaN, sy[i+1])
          }
          break
        default:
          unreachable()
      }
      prev_finite = is_finite
      is_finite = next_finite
    }
    if (drawing) {
      const i = indices[npoints-1]
      if (this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i]))
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
  } & Mixins

  export type Mixins = mixins.LineScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar}
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
    this.define<Step.Props>(() => ({
      mode: [ StepMode, "before" ],
    }))
  }
}
