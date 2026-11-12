import type {SpatialIndex} from "core/util/spatial"
import type {PointGeometry, RectGeometry, SpanGeometry} from "core/geometry"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect, FloatArray} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {minmax2} from "core/util/arrayable"
import type {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, SupportsPathMarking} from "./glyph"
import {generic_line_vector_legend, line_interpolation} from "./utils"
import {Selection} from "../selections/selection"
import type {MultiLineGL} from "./webgl/multi_line"

import {
  path_segments, trim_path, trace_path, paint_path_markings, hit_path_marking,
  span_path_indices, path_marking_hits_span, path_marking_hits_rect,
} from "./marked_path"

export interface MultiLineView extends MultiLine.Data {}

export class MultiLineView extends GlyphView {
  declare model: MultiLine
  declare visuals: MultiLine.Visuals

  /** @internal */
  declare glglyph?: MultiLineGL

  override async load_glglyph() {
    const {MultiLineGL} = await import("./webgl/multi_line")
    return MultiLineGL
  }

  protected override _compute_can_use_webgl(): boolean {
    // Path markings are painted on the canvas. Until the WebGL path can shorten
    // its line geometry to matching start and end insets, keep both the shaft
    // and its path_markings on the same backend.
    return this.model.path_markings.length == 0
  }

  protected override _project_data(): void {
    this._project_xy<MultiLine.Data>("xs", this.xs.data, "ys", this.ys.data)
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const xsi = this.xs.get(i)
      const ysi = this.ys.get(i)

      const [x0, x1, y0, y1] = minmax2(xsi, ysi)
      index.add_rect(x0, y0, x1, y1)
    }
  }

  override paint(ctx: Context2d, indices: Int32Array, data?: Partial<MultiLine.Data>): void {
    const uses_webgl = this.has_webgl()
    super.paint(ctx, indices, data)

    if (uses_webgl) {
      const {sxs, sys} = {...this, ...data}
      for (const i of indices) {
        this._render_path_markings(ctx, i, sxs.get(i), sys.get(i))
      }
    }
  }

  protected _paint(ctx: Context2d, indices: Int32Array, data?: Partial<MultiLine.Data>): void {
    const {sxs, sys} = {...this, ...data}

    for (const i of indices) {
      const sx = sxs.get(i)
      const sy = sys.get(i)

      const segments = path_segments(sx, sy)
      if (segments.length != 0) {
        const {start, end} = this._path_marking_insets(i)
        const visible = trim_path(segments, start, end)

        if (this.visuals.line.doit) {
          ctx.beginPath()
          trace_path(ctx, visible)
          this.visuals.line.set_vectorize(ctx, i)
          ctx.stroke()
        }

        paint_path_markings(ctx, this.path_markings.values(), i, segments)
      }
    }
  }

  protected _render_path_markings(ctx: Context2d, i: number, sx: FloatArray, sy: FloatArray): void {
    if (this.path_markings.size == 0) {
      return
    }

    paint_path_markings(ctx, this.path_markings.values(), i, path_segments(sx, sy))
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const point = {x: geometry.sx, y: geometry.sy}
    let shortest = 9999

    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const threshold = Math.max(2, this.line_width.get(i)/2)

      const sxsi = this.sxs.get(i)
      const sysi = this.sys.get(i)
      const segments = path_segments(sxsi, sysi)
      if (segments.length == 0) {
        continue
      }

      const {start, end} = this._path_marking_insets(i)
      const visible = trim_path(segments, start, end)

      let points: number[] | null = null
      for (const segment of visible) {
        const p0 = {x: segment.sx0, y: segment.sy0}
        const p1 = {x: segment.sx1, y: segment.sy1}
        const dist = hittest.dist_to_segment(point, p0, p1)
        if (dist < threshold && dist < shortest) {
          shortest = dist
          points = [segment.index]
        }
      }

      for (const path_marking of this.path_markings.values()) {
        const index = hit_path_marking(point, path_marking, i, segments)
        if (index != null) {
          shortest = 0
          points = [index]
        }
      }
      if (points != null) {
        hits.set(i, points)
      }
    }

    return Selection.create({
      indices: [...hits.keys()],
      multiline_indices: hits,
    })
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const val = geometry.direction == "h" ? geometry.sx : geometry.sy

    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const segments = path_segments(this.sxs.get(i), this.sys.get(i))
      if (segments.length == 0) {
        continue
      }

      const {start, end} = this._path_marking_insets(i)
      const visible = trim_path(segments, start, end)
      const points = new Set(span_path_indices(visible, geometry.direction, val))

      for (const path_marking of this.path_markings.values()) {
        const index = path_marking_hits_span(path_marking, i, segments, geometry.direction, val)
        if (index != null) {
          points.add(index)
        }
      }
      if (points.size > 0) {
        hits.set(i, [...points])
      }
    }

    return Selection.create({
      indices: [...hits.keys()],
      multiline_indices: hits,
    })
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const segments = path_segments(this.sxs.get(i), this.sys.get(i))
      if (segments.length == 0) {
        continue
      }

      const {start, end} = this._path_marking_insets(i)
      const visible = trim_path(segments, start, end)
      const points = new Set<number>()

      for (const segment of visible) {
        if (hittest.segment_intersects_rect(
          {x: segment.sx0, y: segment.sy0},
          {x: segment.sx1, y: segment.sy1},
          geometry,
        )) {
          points.add(segment.index)
        }
      }

      for (const path_marking of this.path_markings.values()) {
        const index = path_marking_hits_rect(path_marking, i, segments, geometry)
        if (index != null) {
          points.add(index)
        }
      }

      if (points.size > 0) {
        hits.set(i, [...points])
      }
    }

    return Selection.create({
      indices: [...hits.keys()],
      multiline_indices: hits,
    })
  }

  get_interpolation_hit(i: number, point_i: number, geometry: PointGeometry | SpanGeometry): [number, number] {
    const xsi = this.xs.get(i)
    const ysi = this.ys.get(i)
    const x2 = xsi[point_i]
    const y2 = ysi[point_i]
    const x3 = xsi[point_i + 1]
    const y3 = ysi[point_i + 1]
    return line_interpolation(this.renderer, geometry, x2, y2, x3, y3)
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(): [number, number] {
    throw new Error(`${this}.scenterxy() is not implemented`)
  }
}

export namespace MultiLine {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    xs: p.CoordinateSeqSpec
    ys: p.CoordinateSeqSpec
  } & Mixins & SupportsPathMarking

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface MultiLine extends MultiLine.Attrs {}

export class MultiLine extends Glyph {
  declare properties: MultiLine.Props
  declare __view_type__: MultiLineView

  static {
    this.prototype.default_view = MultiLineView

    this.define<MultiLine.Props>(({}) => ({
      xs: [ p.XCoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.YCoordinateSeqSpec, {field: "ys"} ],
    }))
    this.mixins<MultiLine.Mixins>(LineVector)
    this.define<SupportsPathMarking>(SupportsPathMarking)
  }
}
