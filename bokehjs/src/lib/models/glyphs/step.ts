import type {PointGeometry, SpanGeometry} from "core/geometry"
import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {generic_line_scalar_legend} from "./utils"
import {Selection} from "../selections/selection"
import * as hittest from "core/hittest"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Rect, Arrayable} from "core/types"
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

    this.visuals.line.set_value(ctx)

    let drawing = false
    let prev_finite = false
    const i = indices[0]
    let is_finite = isFinite(sx[i] + sy[i])
    if (mode == "center") {
      drawing = this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])
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
    if (drawing) {
      const i = indices[indices.length-1]
      if (this._render_xy(ctx, drawing, is_finite ? sx[i] : NaN, sy[i])) {
        ctx.stroke()
      }
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

  get_interpolation_hit(i: number, _geometry: PointGeometry | SpanGeometry): [number, number] {
    // For step glyphs, return the data point at index i (snapped)
    return [this.x[i], this.y[i]]
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const result = new Selection()
    const point = {x: geometry.sx, y: geometry.sy}
    const threshold = Math.max(2, this.line_width.value / 2)
    const mode = this.model.mode
    const n = Math.min(this.sx.length, this.sy.length)

    let shortest = Infinity
    let hit_index: number | null = null

    for (let j = 0; j < n - 1; j++) {
      const segments = this._get_step_segments(j, mode)

      for (const [p0, p1] of segments) {
        const dist = hittest.dist_to_segment(point, p0, p1)
        if (dist < threshold && dist < shortest) {
          shortest = dist
          hit_index = j
        }
      }
    }

    if (hit_index != null) {
      result.add_to_selected_glyphs(this.model)
      result.view = this
      result.line_indices = [hit_index]
    }

    return result
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let val: number
    let values: Arrayable<number>
    if (geometry.direction == "v") {
      val = this.renderer.yscale.invert(sy)
      values = this.y
    } else {
      val = this.renderer.xscale.invert(sx)
      values = this.x
    }

    const indices = []
    for (let i = 0, end = values.length - 1; i < end; i++) {
      const curr = values[i]
      const next = values[i + 1]

      if ((curr <= val && val <= next) || (next <= val && val <= curr)) {
        indices.push(i)
      }
    }

    const result = new Selection()
    if (indices.length != 0) {
      result.add_to_selected_glyphs(this.model)
      result.view = this
      result.line_indices = indices
    }
    return result
  }

  /**
   * Convert a step between two data points into line segments.
   * For "before" mode: vertical then horizontal.
   * For "after" mode: horizontal then vertical.
   * For "center" mode: horizontal to midpoint, vertical, then horizontal.
   */
  protected _get_step_segments(j: number, mode: StepMode): Array<[{x: number, y: number}, {x: number, y: number}]> {
    const segments: Array<[{x: number, y: number}, {x: number, y: number}]> = []

    const x0 = this.sx[j]
    const y0 = this.sy[j]
    const x1 = this.sx[j + 1]
    const y1 = this.sy[j + 1]

    if (!isFinite(x0 + y0 + x1 + y1)) {
      return segments
    }

    switch (mode) {
      case "before":
        segments.push([{x: x0, y: y0}, {x: x0, y: y1}])
        segments.push([{x: x0, y: y1}, {x: x1, y: y1}])
        break
      case "after":
        segments.push([{x: x0, y: y0}, {x: x1, y: y0}])
        segments.push([{x: x1, y: y0}, {x: x1, y: y1}])
        break
      case "center": {
        const midx = (x0 + x1) / 2
        segments.push([{x: x0, y: y0}, {x: midx, y: y0}])
        segments.push([{x: midx, y: y0}, {x: midx, y: y1}])
        segments.push([{x: midx, y: y1}, {x: x1, y: y1}])
        break
      }
    }

    return segments
  }
}

export namespace Step {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    mode: p.Property<StepMode>
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
    this.define<Step.Props>(() => ({
      mode: [ StepMode, "before" ],
    }))
  }
}
