import type {PointGeometry, SpanGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import {Indices} from "core/types"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import {atan2} from "core/util/math"
import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import type {PathDecorationView} from "../graphics/decoration"
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

      const length = Math.hypot(sx1_i - sx0_i, sy1_i - sy0_i)
      const ux = length == 0 ? 0 : (sx1_i - sx0_i)/length
      const uy = length == 0 ? 0 : (sy1_i - sy0_i)/length
      const {start, end} = this._decoration_insets(i)
      const line_start = Math.min(start, length)
      const line_end = Math.max(line_start, length - Math.min(end, length))

      if (this.visuals.line.doit && line_start < line_end) {
        ctx.beginPath()
        ctx.moveTo(sx0_i + line_start*ux, sy0_i + line_start*uy)
        ctx.lineTo(sx0_i + line_end*ux, sy0_i + line_end*uy)
        this.visuals.line.apply(ctx, i)
      }

      this._render_decorations(ctx, i, sx0_i, sy0_i, sx1_i, sy1_i)
    }
  }

  protected _render_decorations(ctx: Context2d, i: number, sx0: number, sy0: number, sx1: number, sy1: number): void {
    for (const decoration of this.decorations.values()) {
      for (const placement of decoration.placements(i)) {
        const {sx, sy, angle} = this._position_decoration(decoration, i, sx0, sy0, sx1, sy1, placement)
        ctx.save()
        ctx.translate(sx, sy)
        ctx.rotate(angle)
        decoration.marking.paint(ctx, i)
        ctx.restore()
      }
    }
  }

  protected _position_decoration(decoration: PathDecorationView, i: number,
      sx0: number, sy0: number, sx1: number, sy1: number, placement = decoration.placements(i)[0]): {sx: number, sy: number, angle: number} {
    const angle = atan2([sx0, sy0], [sx1, sy1]) + Math.PI/2
    const length = Math.hypot(sx1 - sx0, sy1 - sy0)
    const ux = length == 0 ? 0 : (sx1 - sx0)/length
    const uy = length == 0 ? 0 : (sy1 - sy0)/length
    const inset = decoration.inset.get(i)
    if (typeof placement == "number") {
      return {sx: sx0 + placement*(sx1 - sx0), sy: sy0 + placement*(sy1 - sy0), angle}
    }
    switch (placement) {
      case "start": return {sx: sx0 + inset*ux, sy: sy0 + inset*uy, angle: angle + Math.PI}
      case "middle": return {sx: (sx0 + sx1)/2, sy: (sy0 + sy1)/2, angle}
      case "end": return {sx: sx1 - inset*ux, sy: sy1 - inset*uy, angle}
    }
  }

  protected _visible_segment(i: number): [{x: number, y: number}, {x: number, y: number}] {
    const sx0 = this.sx0[i]
    const sy0 = this.sy0[i]
    const sx1 = this.sx1[i]
    const sy1 = this.sy1[i]
    const length = Math.hypot(sx1 - sx0, sy1 - sy0)
    const ux = length == 0 ? 0 : (sx1 - sx0)/length
    const uy = length == 0 ? 0 : (sy1 - sy0)/length
    const {start, end} = this._decoration_insets(i)
    const line_start = Math.min(start, length)
    const line_end = Math.max(line_start, length - Math.min(end, length))
    return [
      {x: sx0 + line_start*ux, y: sy0 + line_start*uy},
      {x: sx0 + line_end*ux, y: sy0 + line_end*uy},
    ]
  }

  protected _hit_decoration(point: {x: number, y: number}, i: number): boolean {
    const {cos, sin} = Math
    const sx0 = this.sx0[i]
    const sy0 = this.sy0[i]
    const sx1 = this.sx1[i]
    const sy1 = this.sy1[i]
    for (const decoration of this.decorations.values()) {
      for (const placement of decoration.placements(i)) {
        const {sx, sy, angle} = this._position_decoration(decoration, i, sx0, sy0, sx1, sy1, placement)
        const dx = point.x - sx
        const dy = point.y - sy
        const c = cos(angle)
        const s = sin(angle)
        if (decoration.marking.contains(c*dx + s*dy, -s*dx + c*dy, i)) {
          return true
        }
      }
    }
    return false
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const point = {x: sx, y: sy}

    const lw_voffset = 2 // FIXME: Use maximum of segments line_width/2 instead of magic constant 2

    const candidates = (() => {
      // Markings can extend beyond the shaft's data-space bounding box.
      if (this.decorations.size != 0) {
        return Indices.all_set(this.data_size)
      }
      const [x0, x1] = this.renderer.xscale.r_invert(sx-lw_voffset, sx+lw_voffset)
      const [y0, y1] = this.renderer.yscale.r_invert(sy-lw_voffset, sy+lw_voffset)
      return this.index.indices({x0, y0, x1, y1})
    })()
    const indices = []

    for (const i of candidates) {
      const threshold2 = Math.max(2, this.line_width.get(i)/2)**2
      const [p0, p1] = this._visible_segment(i)
      const dist2 = hittest.dist_to_segment_squared(point, p0, p1)
      if (dist2 < threshold2 || this._hit_decoration(point, i)) {
        indices.push(i)
      }
    }

    return Selection.create({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const [hr, vr] = this.renderer.plot_view.frame.bbox.ranges
    const {sx, sy} = geometry

    const val = geometry.direction == "h" ? sx : sy

    const indices = []

    const [x0, x1] = this.renderer.xscale.r_invert(hr.start, hr.end)
    const [y0, y1] = this.renderer.yscale.r_invert(vr.start, vr.end)
    const candidates = this.index.indices({x0, y0, x1, y1})

    for (const i of candidates) {
      const [p0, p1] = this._visible_segment(i)
      const v0 = geometry.direction == "h" ? p0.x : p0.y
      const v1 = geometry.direction == "h" ? p1.x : p1.y
      const threshold = 1.5 + this.line_width.get(i)/2
      if ((Math.min(v0, v1) <= val && val <= Math.max(v0, v1)) ||
          (v0 == v1 && Math.abs(v0 - val) <= threshold)) {
        indices.push(i)
      }
    }

    return Selection.create({indices})
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
  override _supports_path_decorations(_placement: string | number): boolean {
    return true
  }

  declare properties: Segment.Props
  declare __view_type__: SegmentView

  static {
    this.prototype.default_view = SegmentView

    this.define<Segment.Props>(() => ({
      x0: [ p.XCoordinateSpec, {field: "x0"} ],
      y0: [ p.YCoordinateSpec, {field: "y0"} ],
      x1: [ p.XCoordinateSpec, {field: "x1"} ],
      y1: [ p.YCoordinateSpec, {field: "y1"} ],
    }))
    this.mixins<Segment.Mixins>(LineVector)
  }
}
