import {RenderOne} from "./defs"
import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, Indices} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {range} from "core/util/array"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import {Range1d} from "../ranges/range1d"

export type MarkerData = XYGlyphData & p.UniformsOf<Marker.Mixins> & {
  readonly size: p.Uniform<number>
  readonly angle: p.Uniform<number>

  readonly max_size: number
}

export interface MarkerView extends MarkerData {}

export abstract class MarkerView extends XYGlyphView {
  override model: Marker
  override visuals: Marker.Visuals

  protected _render_one: RenderOne

  protected _render(ctx: Context2d, indices: number[], data?: MarkerData): void {
    const {sx, sy, size, angle} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const size_i = size.get(i)
      const angle_i = angle.get(i)

      if (!isFinite(sx_i + sy_i + size_i + angle_i))
        continue

      const r = size_i/2

      ctx.beginPath()
      ctx.translate(sx_i, sy_i)

      if (angle_i)
        ctx.rotate(angle_i)

      this._render_one(ctx, i, r, this.visuals)

      if (angle_i)
        ctx.rotate(-angle_i)

      ctx.translate(-sx_i, -sy_i)
    }
  }

  protected override _mask_data(): Indices {
    // dilate the inner screen region by max_size and map back to data space for use in spatial query
    const {bbox} = this.renderer.parent
    const x_target = new Range1d(bbox.x_range)
    const y_target = new Range1d(bbox.y_range)

    const hr = x_target.widen(this.max_size).map((x) => this.renderer.xscale.invert(x))
    const vr = y_target.widen(this.max_size).map((y) => this.renderer.yscale.invert(y))

    return this.index.indices({
      x0: hr.start, x1: hr.end,
      y0: vr.start, y1: vr.end,
    })
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const {max_size} = this
    const {hit_dilation} = this.model

    const sx0 = sx - max_size*hit_dilation
    const sx1 = sx + max_size*hit_dilation
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

    const sy0 = sy - max_size*hit_dilation
    const sy1 = sy + max_size*hit_dilation
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)

    const candidates = this.index.indices({x0, x1, y0, y1})
    const indices: number[] = []

    for (const i of candidates) {
      const s2 = this.size.get(i)/2*hit_dilation
      if (Math.abs(this.sx[i] - sx) <= s2 && Math.abs(this.sy[i] - sy) <= s2) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const bounds = this.bounds()
    const ms = this.max_size/2

    let x0, x1, y0, y1
    if (geometry.direction == "h") {
      y0 = bounds.y0
      y1 = bounds.y1
      const sx0 = sx - ms
      const sx1 = sx + ms
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    } else {
      x0 = bounds.x0
      x1 = bounds.x1
      const sy0 = sy - ms
      const sy1 = sy + ms
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  protected override _hit_poly(geometry: PolyGeometry): Selection {
    const {sx, sy} = geometry

    // TODO (bev) use spatial index to pare candidate list
    const candidates = range(0, this.sx.length)

    const indices = []
    for (let i = 0, end = candidates.length; i < end; i++) {
      const index = candidates[i]
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sx, sy)) {
        indices.push(index)
      }
    }

    return new Selection({indices})
  }

  _get_legend_args({x0, x1, y0, y1}: Rect, index: number): MarkerData {
    // using objects like this seems a little wonky, since the keys are coerced to strings, but it works
    const n = index + 1

    const sx: number[] = new Array(n)
    const sy: number[] = new Array(n)

    sx[index] = (x0 + x1)/2
    sy[index] = (y0 + y1)/2

    const vsize = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.4
    const size = new p.UniformScalar(vsize, n)

    const angle = new p.UniformScalar(0, n) // don't attempt to match glyph angle

    return {sx, sy, size, angle} as any
  }

  override draw_legend_for_index(ctx: Context2d, {x0, x1, y0, y1}: Rect, index: number): void {
    const args = this._get_legend_args({x0, x1, y0, y1}, index)
    this._render(ctx, [index], args) // XXX
  }
}

export namespace Marker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    size: p.DistanceSpec
    angle: p.AngleSpec
    hit_dilation: p.Property<number>
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Marker extends Marker.Attrs {}

export abstract class Marker extends XYGlyph {
  override properties: Marker.Props
  override __view_type__: MarkerView

  constructor(attrs?: Partial<Marker.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<Marker.Mixins>([LineVector, FillVector, HatchVector])
    this.define<Marker.Props>(({Number}) => ({
      size:  [ p.ScreenSizeSpec, {value: 4} ],
      angle: [ p.AngleSpec, 0  ],
      hit_dilation: [ Number, 1.0 ],
    }))
  }
}
