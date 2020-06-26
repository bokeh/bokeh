import {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {minmax} from "core/util/arrayable"
import {sum} from "core/util/arrayable"
import {Arrayable, Rect, NumberArray} from "core/types"
import {PointGeometry, RectGeometry} from "core/geometry"
import {Context2d} from "core/util/canvas"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Line, Fill, Hatch} from "core/visuals"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {isArray, isTypedArray} from "core/util/types"
import {unreachable} from "core/util/assert"

export interface MultiPolygonsData extends GlyphData {
  _xs: NumberArray[][][]
  _ys: NumberArray[][][]

  sxs: NumberArray[][][]
  sys: NumberArray[][][]
}

export interface MultiPolygonsView extends MultiPolygonsData {}

export class MultiPolygonsView extends GlyphView {
  model: MultiPolygons
  visuals: MultiPolygons.Visuals

  protected _hole_index: SpatialIndex

  protected _project_data(): void {
    // TODO
  }

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const xsi = this._xs[i]
      const ysi = this._ys[i]

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
          const [xij0, xij1] = minmax(xsij)
          const [yij0, yij1] = minmax(ysij)
          xi0 = min(xi0, xij0)
          xi1 = max(xi1, xij1)
          yi0 = min(yi0, yij0)
          yi1 = max(yi1, yij1)
        }
      }

      if (!isFinite(xi0 + xi1 + yi0 + yi1))
        index.add_empty()
      else
        index.add(xi0, yi0, xi1, yi1)
    }

    this._hole_index = this._index_hole_data()
  }

  protected _index_hole_data(): SpatialIndex {
    const {min, max} = Math
    const {data_size} = this

    const index = new SpatialIndex(data_size)

    for (let i = 0; i < data_size; i++) {
      const xsi = this._xs[i]
      const ysi = this._ys[i]

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
            const [xij0, xij1] = minmax(xsij[k])
            const [yij0, yij1] = minmax(ysij[k])
            xi0 = min(xi0, xij0)
            xi1 = max(xi1, xij1)
            yi0 = min(yi0, yij0)
            yi1 = max(yi1, yij1)
          }
        }
      }

      if (!isFinite(xi0 + xi1 + yi0 + yi1))
        index.add_empty()
      else
        index.add(xi0, yi0, xi1, yi1)
    }

    index.finish()
    return index
  }

  protected _mask_data(): number[] {
    const xr = this.renderer.plot_view.frame.x_range
    const [x0, x1] = [xr.min, xr.max]

    const yr = this.renderer.plot_view.frame.y_range
    const [y0, y1] = [yr.min, yr.max]

    const indices = this.index.indices({x0, x1, y0, y1})

    // TODO this is probably needed in patches as well so that we don't draw glyphs multiple times
    return indices.sort((a, b) => a - b).filter((value, index, array) => {
      return (index === 0) || (value !== array[index - 1])
    })
  }

  protected _inner_loop(ctx: Context2d, sx: Arrayable<Arrayable<Arrayable<number>>>, sy: Arrayable<Arrayable<Arrayable<number>>>): void {
    ctx.beginPath()
    for (let j = 0, endj = sx.length; j < endj; j++) {
      for (let k = 0, endk = sx[j].length; k < endk; k++) {
        const _sx = sx[j][k]
        const _sy = sy[j][k]

        for (let l = 0, endl = _sx.length; l < endl; l++) {
          if (l == 0) {
            ctx.moveTo(_sx[l], _sy[l])
            continue
          } else
            ctx.lineTo(_sx[l], _sy[l])
        }
        ctx.closePath()
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[], {sxs, sys}: MultiPolygonsData): void {
    if (this.visuals.fill.doit || this.visuals.line.doit) {

      for (const i of indices) {
        const [sx, sy] = [sxs[i], sys[i]]

        if (this.visuals.fill.doit) {
          this.visuals.fill.set_vectorize(ctx, i)
          this._inner_loop(ctx, sx, sy)
          ctx.fill("evenodd")
        }

        this.visuals.hatch.doit2(ctx, i, () => {
          this._inner_loop(ctx, sx, sy)
          ctx.fill("evenodd")
        }, () => this.renderer.request_render())

        if (this.visuals.line.doit) {
          this.visuals.line.set_vectorize(ctx, i)
          this._inner_loop(ctx, sx, sy)
          ctx.stroke()
        }
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

    for (let i = 0, end = candidates.length; i < end; i++) {
      const index = candidates[i]
      const sxss = this.sxs[index]
      const syss = this.sys[index]
      let hit = true
      for (let j = 0, endj = sxss.length; j < endj; j++) {
        for (let k = 0, endk = sxss[j][0].length; k < endk; k++) {
          const sx = sxss[j][0][k]
          const sy = syss[j][0][k]
          if (!hittest.point_in_poly(sx, sy, xs, ys)) {
            hit = false
            break
          }
        }
        if (!hit)
          break
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
    const hole_candidates = this._hole_index.indices({x0: x, y0: y, x1: x, y1: y})

    const indices = []
    for (let i = 0, end = candidates.length; i < end; i++) {
      const index = candidates[i]
      const sxs = this.sxs[index]
      const sys = this.sys[index]
      for (let j = 0, endj = sxs.length; j < endj; j++) {
        const nk = sxs[j].length

        if (hittest.point_in_poly(sx, sy, sxs[j][0], sys[j][0])) {
          if (nk == 1) {
            indices.push(index)
          } else if (hole_candidates.indexOf(index) == -1) {
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

  map_data(): void {
    const self = this as any

    for (let [xname, yname] of this.model._coords) {
      const sxname = `s${xname}`
      const syname = `s${yname}`
      xname = `_${xname}`
      yname = `_${yname}`

      if (self[xname] != null && (isArray(self[xname][0]) || isTypedArray(self[xname][0]))) {
        const ni = self[xname].length

        self[sxname] = new Array(ni)
        self[syname] = new Array(ni)

        for (let i = 0; i < ni; i++) {
          const nj = self[xname][i].length
          self[sxname][i] = new Array(nj)
          self[syname][i] = new Array(nj)
          for (let j = 0; j < nj; j++) {
            const nk = self[xname][i][j].length
            self[sxname][i][j] = new Array(nk)
            self[syname][i][j] = new Array(nk)
            for (let k = 0; k < nk; k++) {
              const [sx, sy] = this.renderer.scope.map_to_screen(self[xname][i][j][k], self[yname][i][j][k])
              self[sxname][i][j][k] = sx
              self[syname][i][j][k] = sy
            }
          }
        }
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace MultiPolygons {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    xs: p.CoordinateSeqSpec
    ys: p.CoordinateSeqSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: Line, fill: Fill, hatch: Hatch}
}

export interface MultiPolygons extends MultiPolygons.Attrs {}

export class MultiPolygons extends Glyph {
  properties: MultiPolygons.Props
  __view_type__: MultiPolygonsView

  constructor(attrs?: Partial<MultiPolygons.Attrs>) {
    super(attrs)
  }

  static init_MultiPolygons(): void {
    this.prototype.default_view = MultiPolygonsView

    this.define<MultiPolygons.Props>({
      xs: [ p.CoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.CoordinateSeqSpec, {field: "ys"} ],
    })
    this.mixins<MultiPolygons.Mixins>([LineVector, FillVector, HatchVector])
  }
}
