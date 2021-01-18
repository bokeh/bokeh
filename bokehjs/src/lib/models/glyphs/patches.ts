import {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_vector_legend} from "./utils"
import {minmax, sum} from "core/util/arrayable"
import {Arrayable, Rect, RaggedArray, Indices} from "core/types"
import {PointGeometry, RectGeometry} from "core/geometry"
import {Context2d} from "core/util/canvas"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {unreachable} from "core/util/assert"
import {inplace} from "core/util/projections"

export type PatchesData = GlyphData & p.UniformsOf<Patches.Mixins> & {
  _xs: RaggedArray
  _ys: RaggedArray

  sxs: RaggedArray
  sys: RaggedArray
}

export interface PatchesView extends PatchesData {}

export class PatchesView extends GlyphView {
  model: Patches
  visuals: Patches.Visuals

  protected _project_data(): void {
    inplace.project_xy(this._xs.array, this._ys.array)
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const xsi = this._xs.get(i)
      const ysi = this._ys.get(i)

      if (xsi.length == 0)
        index.add_empty()
      else {
        const [x0, x1] = minmax(xsi)
        const [y0, y1] = minmax(ysi)

        index.add(x0, y0, x1, y1)
      }
    }
  }

  protected _mask_data(): Indices {
    const {x_range, y_range} = this.renderer.plot_view.frame
    return this.index.indices({
      x0: x_range.min, x1: x_range.max,
      y0: y_range.min, y1: y_range.max,
    })
  }

  protected _inner_loop(ctx: Context2d, sx: Arrayable<number>, sy: Arrayable<number>, func: (this: Context2d) => void): void {
    for (let j = 0, end = sx.length; j < end; j++) {
      if (j == 0) {
        ctx.beginPath()
        ctx.moveTo(sx[j], sy[j])
        continue
      } else if (isNaN(sx[j] + sy[j])) {
        ctx.closePath()
        func.apply(ctx)
        ctx.beginPath()
        continue
      } else
        ctx.lineTo(sx[j], sy[j])
    }
    ctx.closePath()
    func.call(ctx)
  }

  protected _render(ctx: Context2d, indices: number[], {sxs, sys}: PatchesData): void {
    for (const i of indices) {
      const sx_i = sxs.get(i)
      const sy_i = sys.get(i)

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        this._inner_loop(ctx, sx_i, sy_i, ctx.fill)
      }

      if (this.visuals.hatch.doit) {
        this.visuals.hatch.set_vectorize(ctx, i)
        this._inner_loop(ctx, sx_i, sy_i, ctx.fill)
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)
        this._inner_loop(ctx, sx_i, sy_i, ctx.stroke)
      }
    }
  }

  protected _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const xs = [sx0, sx1, sx1, sx0]
    const ys = [sy0, sy0, sy1, sy1]
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)

    const candidates = this.index.indices({x0, x1, y0, y1})
    const indices = []

    for (const index of candidates) {
      const sxss = this.sxs.get(index)
      const syss = this.sys.get(index)
      let hit = true
      for (let j = 0, endj = sxss.length; j < endj; j++) {
        const sx = sxss[j]
        const sy = syss[j]
        if (!hittest.point_in_poly(sx, sy, xs, ys)) {
          hit = false
          break
        }
      }
      if (hit) {
        indices.push(index)
      }
    }

    return new Selection({indices})
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry

    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({x0: x, y0: y, x1: x, y1: y})
    const indices = []

    for (const index of candidates) {
      const sxsi = this.sxs.get(index)
      const sysi = this.sys.get(index)

      const n = sxsi.length
      for (let k = 0, j = 0;; j++) {
        if (isNaN(sxsi[j]) || j == n) {
          const sxsi_kj = sxsi.subarray(k, j)
          const sysi_kj = sysi.subarray(k, j)
          if (hittest.point_in_poly(sx, sy, sxsi_kj, sysi_kj)) {
            indices.push(index)
            break
          }
          k = j + 1
        }
        if (j == n)
          break
      }
    }

    return new Selection({indices})
  }

  private _get_snap_coord(array: Arrayable<number>): number {
    return sum(array) / array.length
  }

  scenterxy(i: number, sx: number, sy: number): [number, number] {
    const sxsi = this.sxs.get(i)
    const sysi = this.sys.get(i)

    const n = sxsi.length
    let has_nan = false
    for (let k = 0, j = 0;; j++) {
      const this_nan = isNaN(sxsi[j])
      has_nan = has_nan || this_nan

      if (j == n && !has_nan) {
        const scx = this._get_snap_coord(sxsi)
        const scy = this._get_snap_coord(sysi)
        return [scx, scy]
      }

      if (this_nan || j == n) {
        const sxsi_kj = sxsi.subarray(k, j)
        const sysi_kj = sysi.subarray(k, j)
        if (hittest.point_in_poly(sx, sy, sxsi_kj, sysi_kj)) {
          const scx = this._get_snap_coord(sxsi_kj)
          const scy = this._get_snap_coord(sysi_kj)
          return [scx, scy]
        }
        k = j + 1
      }
      if (j == n)
        break
    }

    unreachable()
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Patches {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    xs: p.CoordinateSeqSpec
    ys: p.CoordinateSeqSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Patches extends Patches.Attrs {}

export class Patches extends Glyph {
  properties: Patches.Props
  __view_type__: PatchesView

  constructor(attrs?: Partial<Patches.Attrs>) {
    super(attrs)
  }

  static init_Patches(): void {
    this.prototype.default_view = PatchesView

    this.define<Patches.Props>(({}) => ({
      xs: [ p.XCoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.YCoordinateSeqSpec, {field: "ys"} ],
    }))
    this.mixins<Patches.Mixins>([LineVector, FillVector, HatchVector])
  }
}
