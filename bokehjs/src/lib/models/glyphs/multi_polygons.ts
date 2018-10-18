import {IBBox} from "core/util/bbox"
import {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {min, max} from "core/util/array"
import {sum} from "core/util/arrayable"
import {Arrayable} from "core/types"
import {PointGeometry} from "core/geometry"
import {Context2d} from "core/util/canvas"
import {NumberSpec} from "core/vectorization"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import * as hittest from "core/hittest"
import {Selection} from "../selections/selection"
import { isArray, isTypedArray } from "core/util/types"

export interface MultiPolygonsData extends GlyphData {
  _xs: Arrayable<Arrayable<Arrayable<Arrayable<number>>>>
  _ys: Arrayable<Arrayable<Arrayable<Arrayable<number>>>>

  sxs: Arrayable<Arrayable<Arrayable<Arrayable<number>>>>
  sys: Arrayable<Arrayable<Arrayable<Arrayable<number>>>>

  hole_index: SpatialIndex
}

export interface MultiPolygonsView extends MultiPolygonsData {}

export class MultiPolygonsView extends GlyphView {
  model: MultiPolygons
  visuals: MultiPolygons.Visuals

  protected _index_data(): SpatialIndex {
    const points = []
    for (let i = 0, end = this._xs.length; i < end; i++) {
      for (let j = 0, endj = this._xs[i].length; j < endj; j++) {
        const xs = this._xs[i][j][0]  // do not use holes
        const ys = this._ys[i][j][0]  // do not use holes

        if (xs.length == 0)
          continue

        points.push({
          minX: min(xs),
          minY: min(ys),
          maxX: max(xs),
          maxY: max(ys),
          i,
        })
      }
    }
    this.hole_index = this._index_hole_data()  // should this be set here?
    return new SpatialIndex(points)
  }

  protected _index_hole_data(): SpatialIndex {
    // need advice on how to use this sure if this could be more useful
    const points = []
    for (let i = 0, end = this._xs.length; i < end; i++) {
      for (let j = 0, endj = this._xs[i].length; j < endj; j++) {
        if (this._xs[i][j].length > 1 ) {
          for (let k = 1, endk = this._xs[i][j].length; k < endk; k++) {
            const xs = this._xs[i][j][k]  // only use holes
            const ys = this._ys[i][j][k]  // only use holes

            if (xs.length == 0)
              continue

            points.push({
              minX: min(xs),
              minY: min(ys),
              maxX: max(xs),
              maxY: max(ys),
              i,
            })
          }
        }
      }
    }
    return new SpatialIndex(points)
  }

  protected _mask_data(): number[] {
    const xr = this.renderer.plot_view.frame.x_ranges["default"]
    const [x0, x1] = [xr.min, xr.max]

    const yr = this.renderer.plot_view.frame.y_ranges["default"]
    const [y0, y1] = [yr.min, yr.max]

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    const indices = this.index.indices(bbox)

    // TODO this is probably needed in patches as well so that we don't draw glyphs multiple times
    return indices.sort((a, b) => a - b).filter((value, index, array) => {
      return (index === 0) || (value !== array[index - 1])
    })
  }

  protected _render(ctx: Context2d, indices: number[], {sxs, sys}: MultiPolygonsData): void {
    if (this.visuals.fill.doit || this.visuals.line.doit) {

      for (const i of indices) {
        ctx.beginPath()
        for (let j = 0, endj = sxs[i].length; j < endj; j++) {
          for (let k = 0, endk = sxs[i][j].length; k < endk; k++) {
            const _sx = sxs[i][j][k]
            const _sy = sys[i][j][k]

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
        if (this.visuals.fill.doit) {
          this.visuals.fill.set_vectorize(ctx, i)
          ctx.fill("evenodd")
        }
        if (this.visuals.line.doit) {
          this.visuals.line.set_vectorize(ctx, i)
          ctx.stroke()
        }
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry

    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({minX: x, minY: y, maxX: x, maxY: y})
    const hole_candidates = this.hole_index.indices({minX: x, minY: y, maxX: x, maxY: y})

    const hits = []
    for (let i = 0, end = candidates.length; i < end; i++) {
      const idx = candidates[i]
      const sxs = this.sxs[idx]
      const sys = this.sys[idx]
      for (let j = 0, endj = sxs.length; j < endj; j++) {
        const nk = sxs[j].length

        if (hittest.point_in_poly(sx, sy, (sxs[j][0] as number[]), (sys[j][0] as number[]))) {
          if (nk == 1) {
            hits.push(idx)
          } else if (hole_candidates.indexOf(idx) == -1) {
            hits.push(idx)
          } else if (nk > 1) {
            let in_a_hole = false
            for (let k = 1; k < nk; k++) {
              const sxs_k = sxs[j][k] as number[]
              const sys_k = sys[j][k] as number[]
              if (hittest.point_in_poly(sx, sy, sxs_k, sys_k)) {
                in_a_hole = true
                break
              } else {
                continue
              }
            }
            if (!in_a_hole) {
              hits.push(idx)
            }
          }
        }
      }
    }

    const result = hittest.create_empty_hit_test_result()
    result.indices = hits
    return result
  }

  private _get_snap_coord(array: Arrayable<number>): number {
    return sum(array) / array.length
  }

  scenterx(i: number, sx: number, sy: number): number {
    if (this.sxs[i].length == 1) {
      // We don't have discontinuous objects so we're ok
      return this._get_snap_coord(this.sxs[i][0][0])
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.sxs[i]
      const sys = this.sys[i]
      for (let j = 0, end = sxs.length; j < end; j++) {
        if (hittest.point_in_poly(sx, sy, (sxs[j][0] as number[]), (sys[j][0] as number[])))
          return this._get_snap_coord(sxs[j][0])
      }
    }

    throw new Error("unreachable code")
  }

  scentery(i: number, sx: number, sy: number): number {
    if (this.sys[i].length == 1) {
      // We don't have discontinuous objects so we're ok
      return this._get_snap_coord(this.sys[i][0][0])
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.sxs[i]
      const sys = this.sys[i]
      for (let j = 0, end = sxs.length; j < end; j++) {
      if (hittest.point_in_poly(sx, sy, (sxs[j][0] as number[]), (sys[j][0] as number[])))
        return this._get_snap_coord(sys[j][0])
      }
    }

    throw new Error("unreachable code")
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
              const [sx, sy] = this.map_to_screen(self[xname][i][j][k], self[yname][i][j][k])
              self[sxname][i][j][k] = sx
              self[syname][i][j][k] = sy
            }
          }
        }
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace MultiPolygons {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends Glyph.Attrs, Mixins {
    xs: NumberSpec
    ys: NumberSpec
  }

  export interface Props extends Glyph.Props {}

  export interface Visuals extends Glyph.Visuals {
    line: Line
    fill: Fill
  }
}

export interface MultiPolygons extends MultiPolygons.Attrs {}

export class MultiPolygons extends Glyph {

  properties: MultiPolygons.Props

  constructor(attrs?: Partial<MultiPolygons.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'MultiPolygons'
    this.prototype.default_view = MultiPolygonsView

    this.coords([['xs', 'ys']])
    this.mixins(['line', 'fill'])
  }
}
MultiPolygons.initClass()
