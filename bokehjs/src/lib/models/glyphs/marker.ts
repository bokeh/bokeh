import type {RenderOne} from "./defs"
import {XYGlyph, XYGlyphView} from "./xy_glyph"
import type {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import {Indices} from "core/types"
import type {Rect} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {minmax2} from "core/util/arrayable"
import {SpatialIndex} from "core/util/spatial"
import {PolarCoordinateTransform} from "../coordinates/polar_mapping"
import {Selection} from "../selections/selection"

export interface MarkerView extends Marker.Data {}

export abstract class MarkerView extends XYGlyphView {
  declare model: Marker
  declare visuals: Marker.Visuals

  protected override get supports_coupled_coordinates(): boolean {
    return true
  }

  private _screen_index?: {index?: SpatialIndex, valid: Indices}

  protected override _map_data(): void {
    super._map_data()
    const {coordinates} = this.renderer
    if (!coordinates.is_separable) {
      const {base_glyph} = this
      if (base_glyph != null && this._is_inherited("x") && this._is_inherited("y")) {
        this._screen_index = base_glyph._screen_index
        return
      }
      const {sx, sy} = this
      const valid = new Indices(this.data_size)
      for (let i = 0; i < this.data_size; i++) {
        valid.set(i, isFinite(sx[i]) && isFinite(sy[i]))
      }
      this._screen_index = {valid}
    } else {
      this._screen_index = undefined
    }
  }

  private _candidates(rect: Rect): Indices {
    if (this._screen_index != null) {
      const data = this._screen_index
      if (data.index == null) {
        const index = new SpatialIndex(this.data_size)
        for (let i = 0; i < this.data_size; i++) {
          index.add_point(this.sx[i], this.sy[i])
        }
        index.finish()
        data.index = index
      }
      const {index, valid} = data
      // Whole-node spatial queries can include empty leaves.
      return index.indices(rect).intersection(valid)
    }
    const [x0, x1] = this.renderer.xscale.r_invert(rect.x0, rect.x1)
    const [y0, y1] = this.renderer.yscale.r_invert(rect.y0, rect.y1)
    return this.index.indices({x0, x1, y0, y1})
  }

  protected _render_one: RenderOne

  protected _paint(ctx: Context2d, indices: Int32Array, data?: Partial<Marker.Data>): void {
    const {sx, sy, size, angle} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const size_i = size.get(i)
      const angle_i = angle.get(i)

      if (!isFinite(sx_i + sy_i + size_i + angle_i)) {
        continue
      }

      const r = size_i/2

      ctx.beginPath()
      ctx.translate(sx_i, sy_i)

      if (angle_i != 0) {
        ctx.rotate(angle_i)
      }

      this._render_one(ctx, i, r, this.visuals)

      if (angle_i != 0) {
        ctx.rotate(-angle_i)
      }

      ctx.translate(-sx_i, -sy_i)
    }
  }

  protected override _mask_data(): Indices {
    if (this._screen_index != null) {
      return this._screen_index.valid
    }
    const {bbox} = this.renderer.plot_view.frame
    const d = this.max_size
    return this._candidates({x0: bbox.left - d, x1: bbox.right + d, y0: bbox.top - d, y1: bbox.bottom + d})
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const {max_size} = this
    const {hit_dilation} = this.model

    const sx0 = sx - max_size*hit_dilation
    const sx1 = sx + max_size*hit_dilation

    const sy0 = sy - max_size*hit_dilation
    const sy1 = sy + max_size*hit_dilation
    const {coordinates} = this.renderer
    if (coordinates instanceof PolarCoordinateTransform && !coordinates.contains(sx, sy)) {
      return Selection.create()
    }
    const candidates = this._candidates({x0: sx0, x1: sx1, y0: sy0, y1: sy1})
    const indices: number[] = []

    for (const i of candidates) {
      const s2 = this.size.get(i)/2*hit_dilation
      if (Math.abs(this.sx[i] - sx) <= s2 && Math.abs(this.sy[i] - sy) <= s2) {
        indices.push(i)
      }
    }

    return Selection.create({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const half_size = this.max_size/2
    if (this._screen_index != null) {
      const {left, right, top, bottom} = this.renderer.plot_view.frame.bbox
      const rect = geometry.direction == "h"
        ? {x0: sx - half_size, x1: sx + half_size, y0: top, y1: bottom}
        : {x0: left, x1: right, y0: sy - half_size, y1: sy + half_size}
      return Selection.create({indices: [...this._candidates(rect)]})
    }
    const bounds = this.bounds()

    const [x0, x1, y0, y1] = (() => {
      if (geometry.direction == "h") {
        const {y0, y1} = bounds
        const sx0 = sx - half_size
        const sx1 = sx + half_size
        const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
        return [x0, x1, y0, y1]
      } else {
        const {x0, x1} = bounds
        const sy0 = sy - half_size
        const sy1 = sy + half_size
        const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
        return [x0, x1, y0, y1]
      }
    })()

    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return Selection.create({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const indices = [...this._candidates({x0: Math.min(sx0, sx1), x1: Math.max(sx0, sx1), y0: Math.min(sy0, sy1), y1: Math.max(sy0, sy1)})]
    return Selection.create({indices})
  }

  protected override _hit_poly(geometry: PolyGeometry): Selection {
    const {sx: sxs, sy: sys} = geometry

    const candidates = (() => {
      const [x0, x1, y0, y1] = minmax2(sxs, sys)
      return this._candidates({x0, x1, y0, y1})
    })()

    const indices = []
    for (const i of candidates) {
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sxs, sys)) {
        indices.push(i)
      }
    }

    return Selection.create({indices})
  }

  _get_legend_args({x0, x1, y0, y1}: Rect, index: number): Partial<Marker.Data> {
    // using objects like this seems a little wonky, since the keys are coerced to strings, but it works
    const n = index + 1

    const sx: number[] = new Array(n)
    const sy: number[] = new Array(n)

    sx[index] = (x0 + x1)/2
    sy[index] = (y0 + y1)/2

    const vsize = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.4
    const size = new p.UniformScalar(vsize, n)

    const angle = new p.UniformScalar(0, n) // don't attempt to match glyph angle

    return {sx, sy, size, angle}
  }

  override draw_legend_for_index(ctx: Context2d, {x0, x1, y0, y1}: Rect, index: number): void {
    const args = this._get_legend_args({x0, x1, y0, y1}, index)
    this._paint(ctx, Int32Array.of(index), args)
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

  export type Data = p.GlyphDataOf<Props>
}

export interface Marker extends Marker.Attrs {}

export abstract class Marker extends XYGlyph {
  declare properties: Marker.Props
  declare __view_type__: MarkerView

  static {
    this.mixins<Marker.Mixins>([LineVector, FillVector, HatchVector])
    this.define<Marker.Props>(({Float}) => ({
      size:  [ p.ScreenSizeSpec, {value: 4} ],
      angle: [ p.AngleSpec, 0  ],
      hit_dilation: [ Float, 1.0 ],
    }))
  }
}
