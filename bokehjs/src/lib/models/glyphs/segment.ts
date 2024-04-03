import type {PointGeometry, SpanGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Arrayable, Rect} from "core/types"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import {atan2} from "core/util/math"
import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import {Selection} from "../selections/selection"

export interface SegmentView extends Segment.Data {}

export class SegmentView extends GlyphView {
  declare model: Segment
  declare visuals: Segment.Visuals

  protected override _project_data(): void {
    this._project_xy<Segment.Data>("x0", this.x0, "y0", this.y0)
    this._project_xy<Segment.Data>("x1", this.x1, "y1", this.y1)
  }

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {x0, x1, y0, y1, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x0_i = x0[i]
      const x1_i = x1[i]
      const y0_i = y0[i]
      const y1_i = y1[i]
      index.add_rect(min(x0_i, x1_i), min(y0_i, y1_i), max(x0_i, x1_i), max(y0_i, y1_i))
    }
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Segment.Data>): void {
    const {sx0, sy0, sx1, sy1} = {...this, ...data}

    for (const i of indices) {
      const sx0_i = sx0[i]
      const sy0_i = sy0[i]
      const sx1_i = sx1[i]
      const sy1_i = sy1[i]

      if (!isFinite(sx0_i + sy0_i + sx1_i + sy1_i)) {
        continue
      }

      if (this.visuals.line.v_doit(i)) {
        ctx.beginPath()
        ctx.moveTo(sx0_i, sy0_i)
        ctx.lineTo(sx1_i, sy1_i)
        this.visuals.line.apply(ctx, i)
      }

      this._render_decorations(ctx, i, sx0_i, sy0_i, sx1_i, sy1_i)
    }
  }

  protected _render_decorations(ctx: Context2d, i: number, sx0: number, sy0: number, sx1: number, sy1: number): void {
    const {PI} = Math
    const angle = atan2([sx0, sy0], [sx1, sy1]) + PI/2

    for (const decoration of this.decorations.values()) {
      ctx.save()

      if (decoration.model.node == "start") {
        ctx.translate(sx0, sy0)
        ctx.rotate(angle + PI)
      } else if (decoration.model.node == "end") {
        ctx.translate(sx1, sy1)
        ctx.rotate(angle)
      }

      decoration.marking.paint(ctx, i)
      ctx.restore()
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const point = {x: sx, y: sy}

    const lw_voffset = 2 // FIXME: Use maximum of segments line_width/2 instead of magic constant 2

    const [x0, x1] = this.renderer.xscale.r_invert(sx-lw_voffset, sx+lw_voffset)
    const [y0, y1] = this.renderer.yscale.r_invert(sy-lw_voffset, sy+lw_voffset)

    const candidates = this.index.indices({x0, y0, x1, y1})
    const indices = []

    for (const i of candidates) {
      const threshold2 = Math.max(2, this.line_width.get(i)/2)**2
      const p0 = {x: this.sx0[i], y: this.sy0[i]}
      const p1 = {x: this.sx1[i], y: this.sy1[i]}
      const dist2 = hittest.dist_to_segment_squared(point, p0, p1)
      if (dist2 < threshold2) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const [hr, vr] = this.renderer.plot_view.frame.bbox.ranges
    const {sx, sy} = geometry

    let v0: Arrayable<number>
    let v1: Arrayable<number>
    let val: number
    if (geometry.direction == "v") {
      val = this.renderer.yscale.invert(sy)
      ;[v0, v1] = [this.y0, this.y1]
    } else {
      val = this.renderer.xscale.invert(sx)
      ;[v0, v1] = [this.x0, this.x1]
    }

    const indices = []

    const [x0, x1] = this.renderer.xscale.r_invert(hr.start, hr.end)
    const [y0, y1] = this.renderer.yscale.r_invert(vr.start, vr.end)
    const candidates = this.index.indices({x0, y0, x1, y1})

    for (const i of candidates) {
      if ((v0[i] <= val && val <= v1[i]) || (v1[i] <= val && val <= v0[i])) {
        indices.push(i)
      }

      const threshold = 1.5 + (this.line_width.get(i)/2)// Maximum pixel difference to detect hit

      if (v0[i] == v1[i]) {
        if (geometry.direction == "h") {
          if (Math.abs(this.sx0[i] - sx) <= threshold) {
            indices.push(i)
          }
        } else {
          if (Math.abs(this.sy0[i] - sy) <= threshold) {
            indices.push(i)
          }
        }
      }
    }

    return new Selection({indices})
  }

  scenterxy(i: number): [number, number] {
    const scx = this.sx0[i]/2 + this.sx1[i]/2
    const scy = this.sy0[i]/2 + this.sy1[i]/2
    return [scx, scy]
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Segment {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x0: p.CoordinateSpec
    y0: p.CoordinateSpec
    x1: p.CoordinateSpec
    y1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface Segment extends Segment.Attrs {}

export class Segment extends Glyph {
  declare properties: Segment.Props
  declare __view_type__: SegmentView

  constructor(attrs?: Partial<Segment.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SegmentView

    this.define<Segment.Props>(({}) => ({
      x0: [ p.XCoordinateSpec, {field: "x0"} ],
      y0: [ p.YCoordinateSpec, {field: "y0"} ],
      x1: [ p.XCoordinateSpec, {field: "x1"} ],
      y1: [ p.YCoordinateSpec, {field: "y1"} ],
    }))
    this.mixins<Segment.Mixins>(LineVector)
  }
}
