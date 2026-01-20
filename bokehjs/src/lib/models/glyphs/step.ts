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

  protected override _bounds(bounds: Rect): Rect {
    // Override to account for padding
    const {pad_before, pad_after} = this.model
    return {
      x0: bounds.x0 - pad_before,
      x1: bounds.x1 + pad_after,
      y0: bounds.y0,
      y1: bounds.y1,
    }
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

  protected _build_step_path(indices: number[], data?: Partial<Step.Data>): {xs: number[], ys: number[]} {
    // Builds the step path points for the given indices, including padding
    const {sx, sy} = {...this, ...data}
    const {mode, pad_before, pad_after} = this.model
    const xs: number[] = []
    const ys: number[] = []

    if (indices.length == 0) {
      return {xs, ys}
    }

    const first_i = indices[0]
    const last_i = indices[indices.length - 1]

    if (pad_before != 0) {
      const pad_sx = this.renderer.xscale.s_compute(this.x[first_i] - pad_before) // screen units
      xs.push(pad_sx)
      ys.push(sy[first_i])
    }

    // Step from data points
    for (let k = 0; k < indices.length; k++) {
      const i = indices[k]

      if (!isFinite(sx[i] + sy[i])) {
        xs.push(NaN)
        ys.push(NaN)
        continue
      }

      const has_next = k < indices.length - 1
      const next_i = has_next ? indices[k + 1] : -1
      const valid_next = has_next && isFinite(sx[next_i] + sy[next_i])

      switch (mode) {
        case "before":
          /* First adds vertical line
             For each point: horizontal+vertical (┐ or ┘)
             Finally horizontal */
          xs.push(sx[i])
          ys.push(sy[i])
          if (valid_next) {
            xs.push(sx[i])
            ys.push(sy[next_i])
          }
          break
        case "after":
          /* First: horizontal line
             Middle: vertical+horizontal (┌ or L)
             Last: vertical */
          xs.push(sx[i])
          ys.push(sy[i])
          if (valid_next) {
            xs.push(sx[next_i])
            ys.push(sy[i])
          }
          break
        case "center":
          /* Each point contributes a horizontal segment from left_edge to right_edge at y=sy[i].
             First: Left edge is the first x point itself.
             Middle points: Left edge is halfway to previous point, right edge is halfway to next point.
             Last: Right edge is the last x point itself.
             This works with gaps as well by breaking the path */
          const prev_i = k > 0 ? indices[k - 1] : -1
          const valid_prev = k > 0 && isFinite(sx[prev_i] + sy[prev_i])

          const left = valid_prev ? (sx[prev_i] + sx[i]) / 2 : sx[i]
          const right = valid_next ? (sx[i] + sx[next_i]) / 2 : sx[i]

          xs.push(left)
          ys.push(sy[i])
          xs.push(right)
          ys.push(sy[i])
          break
        default:
          unreachable()
      }
    }

    if (pad_after != 0) {
      const pad_sx = this.renderer.xscale.s_compute(this.x[last_i] + pad_after) // screen units
      xs.push(pad_sx)
      ys.push(sy[last_i])
    }

    return {xs, ys}
  }

  protected _paint_consecutive(ctx: Context2d, indices: number[], data?: Partial<Step.Data>): void {
    this.visuals.line.set_value(ctx)

    const {xs, ys} = this._build_step_path(indices, data)

    let drawing = false
    for (let i = 0; i < xs.length; i++) {
      drawing = this._render_xy(ctx, drawing, xs[i], ys[i])
    }

    if (drawing) {
      ctx.stroke()
    }
  }

  protected _render_xy(ctx: Context2d, drawing: boolean, x: number, y: number): boolean {
    if (isFinite(x + y)) {
      if (drawing) {
        ctx.lineTo(x, y)
      } else {
        ctx.beginPath()
        ctx.moveTo(x, y)
        drawing = true
      }
    } else if (drawing) {
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
    this.define<Step.Props>(({Float, NonNegative}) => ({
      mode: [ StepMode, "before" ],
      pad_before: [ NonNegative(Float), 0 ],
      pad_after: [ NonNegative(Float), 0 ],
    }))
  }
}
