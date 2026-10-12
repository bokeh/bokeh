import {cubic_path, trim_path, trace_path, paint_decorations, hit_decoration,
        span_path_indices, decoration_hits_span, decoration_hits_rect} from "./decorated_path"
import type {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import type {PathSegment} from "./decorated_path"
import {dist_to_segment, segment_intersects_rect} from "core/hittest"
import {Selection} from "../selections/selection"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import {cbb} from "core/util/algorithms"
import * as p from "core/properties"

export interface BezierView extends Bezier.Data {}

export class BezierView extends GlyphView {
  declare model: Bezier
  declare visuals: Bezier.Visuals

  protected override _project_data(): void {
    this._project_xy<Bezier.Data>("x0", this.x0, "y0", this.y0)
    this._project_xy<Bezier.Data>("x1", this.x1, "y1", this.y1)
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size, x0, y0, x1, y1, cx0, cy0, cx1, cy1} = this

    for (let i = 0; i < data_size; i++) {
      const x0_i = x0[i]
      const y0_i = y0[i]
      const x1_i = x1[i]
      const y1_i = y1[i]
      const cx0_i = cx0[i]
      const cy0_i = cy0[i]
      const cx1_i = cx1[i]
      const cy1_i = cy1[i]

      if (!isFinite(x0_i + x1_i + y0_i + y1_i + cx0_i + cy0_i + cx1_i + cy1_i)) {
        index.add_empty()
      } else {
        const {x0, y0, x1, y1} = cbb(x0_i, y0_i, cx0_i, cy0_i, cx1_i, cy1_i, x1_i, y1_i)
        index.add_rect(x0, y0, x1, y1)
      }
    }
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Bezier.Data): void {
    if (!this.visuals.line.doit && this.decorations.size == 0) {
      return
    }

    const {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1} = {...this, ...data}

    for (const i of indices) {
      const sx0_i = sx0[i]
      const sy0_i = sy0[i]
      const sx1_i = sx1[i]
      const sy1_i = sy1[i]
      const scx0_i = scx0[i]
      const scy0_i = scy0[i]
      const scx1_i = scx1[i]
      const scy1_i = scy1[i]

      if (!isFinite(sx0_i + sy0_i + sx1_i + sy1_i + scx0_i + scy0_i + scx1_i + scy1_i)) {
        continue
      }

      if (this.decorations.size != 0) {
        const segments = cubic_path(sx0_i, sy0_i, scx0_i, scy0_i, scx1_i, scy1_i, sx1_i, sy1_i)
        const {start, end} = this._decoration_insets(i)
        if (this.visuals.line.doit) {
          ctx.beginPath()
          trace_path(ctx, trim_path(segments, start, end))
          this.visuals.line.apply(ctx, i)
        }
        paint_decorations(ctx, this.decorations.values(), i, segments)
        continue
      }

      ctx.beginPath()
      ctx.moveTo(sx0_i, sy0_i)
      ctx.bezierCurveTo(scx0_i, scy0_i, scx1_i, scy1_i, sx1_i, sy1_i)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _screen_path(i: number): PathSegment[] {
    return cubic_path(this.sx0[i], this.sy0[i], this.scx0[i], this.scy0[i],
      this.scx1[i], this.scy1[i], this.sx1[i], this.sy1[i])
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const point = {x: geometry.sx, y: geometry.sy}
    const indices: number[] = []
    for (let i = 0; i < this.data_size; i++) {
      const segments = this._screen_path(i)
      const {start, end} = this._decoration_insets(i)
      const threshold = Math.max(2, this.line_width.get(i)/2)
      const shaft = trim_path(segments, start, end).some(segment => dist_to_segment(point,
        {x: segment.sx0, y: segment.sy0}, {x: segment.sx1, y: segment.sy1}) < threshold)
      const marking = [...this.decorations.values()].some(decoration => hit_decoration(point, decoration, i, segments) != null)
      if (shaft || marking) {
        indices.push(i)
      }
    }
    return Selection.create({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const value = geometry.direction == "h" ? geometry.sx : geometry.sy
    const indices: number[] = []
    for (let i = 0; i < this.data_size; i++) {
      const segments = this._screen_path(i)
      const {start, end} = this._decoration_insets(i)
      if (span_path_indices(trim_path(segments, start, end), geometry.direction, value).length != 0 ||
          [...this.decorations.values()].some(decoration => decoration_hits_span(decoration, i, segments, geometry.direction, value) != null)) {
        indices.push(i)
      }
    }
    return Selection.create({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices: number[] = []
    for (let i = 0; i < this.data_size; i++) {
      const segments = this._screen_path(i)
      const {start, end} = this._decoration_insets(i)
      if (trim_path(segments, start, end).some(segment => segment_intersects_rect(
        {x: segment.sx0, y: segment.sy0}, {x: segment.sx1, y: segment.sy1}, geometry)) ||
          [...this.decorations.values()].some(decoration => decoration_hits_rect(decoration, i, segments, geometry) != null)) {
        indices.push(i)
      }
    }
    return Selection.create({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(): [number, number] {
    throw new Error(`${this}.scenterxy() is not implemented`)
  }
}

export namespace Bezier {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x0: p.CoordinateSpec
    y0: p.CoordinateSpec
    x1: p.CoordinateSpec
    y1: p.CoordinateSpec
    cx0: p.CoordinateSpec
    cy0: p.CoordinateSpec
    cx1: p.CoordinateSpec
    cy1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface Bezier extends Bezier.Attrs {}

export class Bezier extends Glyph {
  declare properties: Bezier.Props
  declare __view_type__: BezierView

  static {
    this.prototype.default_view = BezierView

    this.define<Bezier.Props>(({}) => ({
      x0:  [ p.XCoordinateSpec, {field: "x0"} ],
      y0:  [ p.YCoordinateSpec, {field: "y0"} ],
      x1:  [ p.XCoordinateSpec, {field: "x1"} ],
      y1:  [ p.YCoordinateSpec, {field: "y1"} ],
      cx0: [ p.XCoordinateSpec, {field: "cx0"} ],
      cy0: [ p.YCoordinateSpec, {field: "cy0"} ],
      cx1: [ p.XCoordinateSpec, {field: "cx1"} ],
      cy1: [ p.YCoordinateSpec, {field: "cy1"} ],
    }))
    this.mixins<Bezier.Mixins>(LineVector)
  }
}
