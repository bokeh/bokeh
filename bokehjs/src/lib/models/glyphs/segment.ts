import {PointGeometry, SpanGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Arrayable, Rect} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_legend} from "./utils"
import {Selection} from "../selections/selection"

export interface SegmentData extends GlyphData {
  _x0: Arrayable<number>
  _y0: Arrayable<number>
  _x1: Arrayable<number>
  _y1: Arrayable<number>

  sx0: Arrayable<number>
  sy0: Arrayable<number>
  sx1: Arrayable<number>
  sy1: Arrayable<number>
}

export interface SegmentView extends SegmentData {}

export class SegmentView extends GlyphView {
  model: Segment
  visuals: Segment.Visuals

  protected _index_data(): SpatialIndex {
    const points = []

    for (let i = 0, end = this._x0.length; i < end; i++) {
      const x0 = this._x0[i]
      const x1 = this._x1[i]
      const y0 = this._y0[i]
      const y1 = this._y1[i]

      if (!isNaN(x0 + x1 + y0 + y1)) {
        points.push({
          x0: Math.min(x0, x1),
          y0: Math.min(y0, y1),
          x1: Math.max(x0, x1),
          y1: Math.max(y0, y1),
          i,
        })
      }
    }

    return new SpatialIndex(points)
  }

  protected _render(ctx: Context2d, indices: number[], {sx0, sy0, sx1, sy1}: SegmentData): void {
    if (this.visuals.line.doit) {
      for (const i of indices) {
        if (isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i]))
          continue

        ctx.beginPath()
        ctx.moveTo(sx0[i], sy0[i])
        ctx.lineTo(sx1[i], sy1[i])

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const point = {x: sx, y: sy}

    const lw_voffset = 2 // FIXME: Use maximum of segments line_width/2 instead of magic constant 2

    const [x0, x1] = this.renderer.xscale.r_invert(sx-lw_voffset, sx+lw_voffset)
    const [y0, y1] = this.renderer.yscale.r_invert(sy-lw_voffset, sy+lw_voffset)

    const candidates = this.index.indices({x0, y0, x1, y1})
    const indices = []

    for (const i of candidates) {
      const threshold2 = Math.max(2, this.visuals.line.cache_select('line_width', i) / 2)**2
      const p0 = {x: this.sx0[i], y: this.sy0[i]}
      const p1 = {x: this.sx1[i], y: this.sy1[i]}
      const dist2 = hittest.dist_to_segment_squared(point, p0, p1)
      if (dist2 < threshold2) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const [hr, vr] = this.renderer.plot_view.frame.bbox.ranges
    const {sx, sy} = geometry

    let v0: Arrayable<number>
    let v1: Arrayable<number>
    let val: number
    if (geometry.direction == 'v') {
      val = this.renderer.yscale.invert(sy)
      ;[v0, v1] = [this._y0, this._y1]
    } else {
      val = this.renderer.xscale.invert(sx)
      ;[v0, v1] = [this._x0, this._x1]
    }

    const indices = []

    const [x0, x1] = this.renderer.xscale.r_invert(hr.start, hr.end)
    const [y0, y1] = this.renderer.yscale.r_invert(vr.start, vr.end)
    const candidates = this.index.indices({x0, y0, x1, y1})

    for (const i of candidates) {
      if ((v0[i] <= val && val <= v1[i]) || (v1[i] <= val && val <= v0[i]))
        indices.push(i)

      const threshold = 1.5 + (this.visuals.line.cache_select('line_width', i) / 2)// Maximum pixel difference to detect hit

      if (v0[i] == v1[i]) {
        if (geometry.direction == 'h') {
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

  scenterx(i: number): number {
    return (this.sx0[i] + this.sx1[i])/2
  }

  scentery(i: number): number {
    return (this.sy0[i] + this.sy1[i])/2
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
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

  export type Visuals = Glyph.Visuals & {line: Line}
}

export interface Segment extends Segment.Attrs {}

export class Segment extends Glyph {
  properties: Segment.Props
  __view_type__: SegmentView

  constructor(attrs?: Partial<Segment.Attrs>) {
    super(attrs)
  }

  static init_Segment(): void {
    this.prototype.default_view = SegmentView

    this.coords([['x0', 'y0'], ['x1', 'y1']])
    this.mixins<Segment.Mixins>(LineVector)
  }
}
