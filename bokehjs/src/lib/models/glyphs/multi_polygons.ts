import {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import {generic_area_vector_legend} from "./utils"
import {minmax2} from "core/util/arrayable"
import {sum} from "core/util/arrayable"
import type {Arrayable, Rect, Indices} from "core/types"
import type {HitTestPoint, HitTestRect, HitTestPoly} from "core/geometry"
import type {Context2d} from "core/util/canvas"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {unreachable} from "core/util/assert"

export interface MultiPolygonsView extends MultiPolygons.Data {}

export class MultiPolygonsView extends GlyphView {
  declare model: MultiPolygons
  declare visuals: MultiPolygons.Visuals

  protected _hole_index: SpatialIndex

  protected override _project_data(): void {
    // TODO
  }

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const xsi = this.xs[i]
      const ysi = this.ys[i]

      if (xsi.length == 0 || ysi.length == 0) {
        index.add_empty()
        continue
      }

      let xi0 = +Infinity
      let xi1 = -Infinity
      let yi0 = +Infinity
      let yi1 = -Infinity

      for (let j = 0, endj = xsi.length; j < endj; j++) {
        const xsij = xsi[j][0] // do not use holes
        const ysij = ysi[j][0] // do not use holes

        if (xsij.length != 0 && ysij.length != 0) {
          const [xij0, xij1, yij0, yij1] = minmax2(xsij, ysij)
          xi0 = min(xi0, xij0)
          xi1 = max(xi1, xij1)
          yi0 = min(yi0, yij0)
          yi1 = max(yi1, yij1)
        }
      }

      index.add_rect(xi0, yi0, xi1, yi1)
    }

    this._hole_index = this._index_hole_data()
  }

  protected _index_hole_data(): SpatialIndex {
    const {min, max} = Math
    const {data_size} = this

    const index = new SpatialIndex(data_size)

    for (let i = 0; i < data_size; i++) {
      const xsi = this.xs[i]
      const ysi = this.ys[i]

      if (xsi.length == 0 || ysi.length == 0) {
        index.add_empty()
        continue
      }

      let xi0 = +Infinity
      let xi1 = -Infinity
      let yi0 = +Infinity
      let yi1 = -Infinity

      for (let j = 0, endj = xsi.length; j < endj; j++) {
        const xsij = xsi[j]
        const ysij = ysi[j]

        if (xsij.length > 1 && ysij.length > 1) {
          for (let k = 1, endk = xsij.length; k < endk; k++) {
            const [xij0, xij1, yij0, yij1] = minmax2(xsij[k], ysij[k])
            xi0 = min(xi0, xij0)
            xi1 = max(xi1, xij1)
            yi0 = min(yi0, yij0)
            yi1 = max(yi1, yij1)
          }
        }
      }

      index.add_rect(xi0, yi0, xi1, yi1)
    }

    index.finish()
    return index
  }

  protected override _mask_data(): Indices {
    const {x_source, y_source} = this.renderer.coordinates
    return this.index.indices({
      x0: x_source.min, x1: x_source.max,
      y0: y_source.min, y1: y_source.max,
    })
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<MultiPolygons.Data>): void {
    if (!this.visuals.fill.doit && !this.visuals.line.doit) {
      return
    }

    const {sxs, sys} = {...this, ...data}

    for (const i of indices) {
      ctx.beginPath()

      const sx_i = sxs[i]
      const sy_i = sys[i]

      const nj = Math.min(sx_i.length, sy_i.length)
      for (let j = 0; j < nj; j++) {
        const sx_ij = sx_i[j]
        const sy_ij = sy_i[j]

        const nk = Math.min(sx_ij.length, sy_ij.length)
        for (let k = 0; k < nk; k++) {
          const sx_ijk = sx_ij[k]
          const sy_ijk = sy_ij[k]

          const nl = Math.min(sx_ijk.length, sy_ijk.length)
          for (let l = 0; l < nl; l++) {
            const sx_ijkl = sx_ijk[l]
            const sy_ijkl = sy_ijk[l]

            if (l == 0) {
              ctx.moveTo(sx_ijkl, sy_ijkl)
            } else {
              ctx.lineTo(sx_ijkl, sy_ijkl)
            }
          }

          ctx.closePath()
        }
      }

      this.visuals.fill.apply(ctx, i, undefined, "evenodd")
      this.visuals.hatch.apply(ctx, i, undefined, "evenodd")
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

    const indices = []

    for (const i of candidates) {
      const sxs_i = this.sxs[i]
      const sys_i = this.sys[i]
      let hit = !greedy

      const nj = sxs_i.length
      for (let j = 0; j < nj; j++) {
        const sxs_ij0 = sxs_i[j][0]
        const sys_ij0 = sys_i[j][0]

        const nk = sxs_ij0.length
        for (let k = 0; k < nk; k++) {
          const sxs_ij0k = sxs_ij0[k]
          const sys_ij0k = sys_ij0[k]
          if (!hittest.point_in_poly(sxs_ij0k, sys_ij0k, sxs, sys)) {
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
        if (!greedy) {
          if (!hit) {
            break
          }
        } else {
          if (hit) {
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
    const hole_candidates = this._hole_index.indices({x0: x, y0: y, x1: x, y1: y})

    const indices = []
    for (const index of candidates) {
      const sxs = this.sxs[index]
      const sys = this.sys[index]
      for (let j = 0, endj = sxs.length; j < endj; j++) {
        const nk = sxs[j].length

        if (hittest.point_in_poly(sx, sy, sxs[j][0], sys[j][0])) {
          if (nk == 1) {
            indices.push(index)
          } else if (!hole_candidates.get(index)) {
            indices.push(index)
          } else if (nk > 1) {
            let in_a_hole = false
            for (let k = 1; k < nk; k++) {
              const sxs_k = sxs[j][k]
              const sys_k = sys[j][k]
              if (hittest.point_in_poly(sx, sy, sxs_k, sys_k)) {
                in_a_hole = true
                break
              } else {
                continue
              }
            }
            if (!in_a_hole) {
              indices.push(index)
            }
          }
        }
      }
    }

    return new Selection({indices})
  }

  private _get_snap_coord(array: Arrayable<number>): number {
    return sum(array) / array.length
  }

  scenterxy(i: number, sx: number, sy: number): [number, number] {
    if (this.sxs[i].length == 1) {
      // We don't have discontinuous objects so we're ok
      const scx = this._get_snap_coord(this.sxs[i][0][0])
      const scy = this._get_snap_coord(this.sys[i][0][0])
      return [scx, scy]
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.sxs[i]
      const sys = this.sys[i]
      for (let j = 0, end = sxs.length; j < end; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j][0], sys[j][0])) {
          const scx = this._get_snap_coord(sxs[j][0])
          const scy = this._get_snap_coord(sys[j][0])
          return [scx, scy]
        }
      }
    }

    unreachable()
  }

  override map_data(): void {
    if (this.inherited_xs && this.inherited_ys) {
      this._inherit_attr<MultiPolygons.Data>("sxs")
      this._inherit_attr<MultiPolygons.Data>("sys")
    } else {
      const {xs, ys} = this
      const n_i = xs.length
      const sxs = new Array(n_i)
      const sys = new Array(n_i)
      for (let i = 0; i < n_i; i++) {
        const n_j = xs[i].length
        sxs[i] = new Array(n_j)
        sys[i] = new Array(n_j)
        for (let j = 0; j < n_j; j++) {
          const n_k = xs[i][j].length
          sxs[i][j] = new Array(n_k)
          sys[i][j] = new Array(n_k)
          for (let k = 0; k < n_k; k++) {
            const [sx, sy] = this.renderer.coordinates.map_to_screen(xs[i][j][k], ys[i][j][k])
            sxs[i][j][k] = sx
            sys[i][j][k] = sy
          }
        }
      }
      this._define_attr<MultiPolygons.Data>("sxs", sxs)
      this._define_attr<MultiPolygons.Data>("sys", sys)
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace MultiPolygons {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    xs: p.CoordinateSeqSeqSeqSpec
    ys: p.CoordinateSeqSeqSeqSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface MultiPolygons extends MultiPolygons.Attrs {}

export class MultiPolygons extends Glyph {
  declare properties: MultiPolygons.Props
  declare __view_type__: MultiPolygonsView

  constructor(attrs?: Partial<MultiPolygons.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultiPolygonsView

    this.define<MultiPolygons.Props>(({}) => ({
      xs: [ p.XCoordinateSeqSeqSeqSpec, {field: "xs"} ],
      ys: [ p.YCoordinateSeqSeqSeqSpec, {field: "ys"} ],
    }))
    this.mixins<MultiPolygons.Mixins>([LineVector, FillVector, HatchVector])
  }
}
