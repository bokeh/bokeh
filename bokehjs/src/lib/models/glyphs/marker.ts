import {RenderOne} from "./defs"
import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Arrayable, Rect, Indices} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {range} from "core/util/array"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface MarkerData extends XYGlyphData {
  _size: Arrayable<number>
  _angle: Arrayable<number>

  max_size: number
}

export interface MarkerView extends MarkerData {}

export abstract class MarkerView extends XYGlyphView {
  model: Marker
  visuals: Marker.Visuals

  protected _render_one: RenderOne

  protected _render(ctx: Context2d, indices: number[], {sx, sy, _size, _angle}: MarkerData): void {
    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const size_i = _size[i]
      const angle_i = _angle[i]

      if (isNaN(sx_i + sy_i + size_i + angle_i))
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

  protected _mask_data(): Indices {
    // dilate the inner screen region by max_size and map back to data space for use in spatial query
    const {x_target, y_target} = this.renderer.plot_view.frame

    const hr = x_target.widen(this.max_size).map((x) => this.renderer.xscale.invert(x))
    const vr = y_target.widen(this.max_size).map((y) => this.renderer.yscale.invert(y))

    return this.index.indices({
      x0: hr.start, x1: hr.end,
      y0: vr.start, y1: vr.end,
    })
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry

    const sx0 = sx - this.max_size
    const sx1 = sx + this.max_size
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

    const sy0 = sy - this.max_size
    const sy1 = sy + this.max_size
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)

    const candidates = this.index.indices({x0, x1, y0, y1})
    const indices: number[] = []

    for (const i of candidates) {
      const s2 = this._size[i]/2
      if (Math.abs(this.sx[i] - sx) <= s2 && Math.abs(this.sy[i] - sy) <= s2) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const bounds = this.bounds()
    const ms = this.max_size/2

    let x0, x1, y0, y1
    if (geometry.direction == 'h') {
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

  protected _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  protected _hit_poly(geometry: PolyGeometry): Selection {
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

  _get_legend_args({x0, x1, y0, y1}: Rect, index: number): any {
    // using objects like this seems a little wonky, since the keys are coerced to strings, but it works
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const size: number[] = new Array(len)
    size[index] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.4
    const angle: number[] = new Array(len)
    angle[index] = 0 // don't attempt to match glyph angle

    return {sx, sy, _size: size, _angle: angle}
  }

  draw_legend_for_index(ctx: Context2d, {x0, x1, y0, y1}: Rect, index: number): void {
    const args = this._get_legend_args({x0, x1, y0, y1}, index)
    this._render(ctx, [index], args) // XXX
  }
}

export namespace Marker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    size: p.DistanceSpec
    angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Marker extends Marker.Attrs {}

export abstract class Marker extends XYGlyph {
  properties: Marker.Props
  __view_type__: MarkerView

  constructor(attrs?: Partial<Marker.Attrs>) {
    super(attrs)
  }

  static init_Marker(): void {
    this.mixins<Marker.Mixins>([LineVector, FillVector, HatchVector])
    this.define<Marker.Props>(({}) => ({
      size:  [ p.ScreenDistanceSpec, {value: 4} ],
      angle: [ p.AngleSpec, 0  ],
    }))
  }
}
