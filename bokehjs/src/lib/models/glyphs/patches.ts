import type {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import {generic_area_vector_legend} from "./utils"
import {minmax2, sum} from "core/util/arrayable"
import type {Arrayable, Rect, Indices} from "core/types"
import type {HitTestPoint, HitTestRect, HitTestPoly} from "core/geometry"
import type {Context2d} from "core/util/canvas"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {unreachable} from "core/util/assert"

export interface PatchesView extends Patches.Data {}

export class PatchesView extends GlyphView {
  declare model: Patches
  declare visuals: Patches.Visuals

  protected override _project_data(): void {
    this._project_xy<Patches.Data>("xs", this.xs.data, "ys", this.ys.data)
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

  protected override _mask_data(): Indices {
    const {x_source, y_source} = this.renderer.coordinates
    return this.index.indices({
      x0: x_source.min, x1: x_source.max,
      y0: y_source.min, y1: y_source.max,
    })
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Patches.Data>): void {
    const {sxs, sys} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sxs.get(i)
      const sy_i = sys.get(i)

      let move = true
      ctx.beginPath()

      const n = Math.min(sx_i.length, sy_i.length)
      for (let j = 0; j < n; j++) {
        const sx_j = sx_i[j]
        const sy_j = sy_i[j]

        if (!isFinite(sx_j + sy_j)) {
          ctx.closePath()
          move = true
        } else {
          if (move) {
            ctx.moveTo(sx_j, sy_j)
            move = false
          } else {
            ctx.lineTo(sx_j, sy_j)
          }
        }
      }

      ctx.closePath()

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_poly(geometry: HitTestPoly): Selection {
    const {sx: sxs, sy: sys, greedy=false} = geometry

    const candidates = (() => {
      const xs = this.renderer.xscale.v_invert(sxs)
      const ys = this.renderer.yscale.v_invert(sys)

      const [x0, x1, y0, y1] = minmax2(xs, ys)
      return this.index.indices({x0, x1, y0, y1})
    })()

    const indices: number[] = []

    for (const i of candidates) {
      const sxs_i = this.sxs.get(i)
      const sys_i = this.sys.get(i)
      const n = sxs_i.length
      if (n == 0) {
        continue
      }
      let hit = !greedy
      for (let j = 0; j < n; j++) {
        const sx = sxs_i[j]
        const sy = sys_i[j]
        if (!hittest.point_in_poly(sx, sy, sxs, sys)) {
          if (!greedy) {
            hit = false
            break
          }
        } else {
          if (greedy) {
            hit = true
            break
          }
        }
      }
      if (hit) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected override _hit_rect(geometry: HitTestRect): Selection {
    const {sx0, sx1, sy0, sy1, greedy} = geometry
    const sxs = [sx0, sx1, sx1, sx0]
    const sys = [sy0, sy0, sy1, sy1]
    return this._hit_poly({type: "poly", sx: sxs, sy: sys, greedy})
  }

  protected override _hit_point(geometry: HitTestPoint): Selection {
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
        if (j == n) {
          break
        }
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
      if (j == n) {
        break
      }
    }

    unreachable()
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
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

  export type Data = p.GlyphDataOf<Props>
}

export interface Patches extends Patches.Attrs {}

export class Patches extends Glyph {
  declare properties: Patches.Props
  declare __view_type__: PatchesView

  constructor(attrs?: Partial<Patches.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PatchesView

    this.define<Patches.Props>(({}) => ({
      xs: [ p.XCoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.YCoordinateSeqSpec, {field: "ys"} ],
    }))
    this.mixins<Patches.Mixins>([LineVector, FillVector, HatchVector])
  }
}
