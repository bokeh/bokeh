import {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {min, max} from "core/util/array"
import {sum} from "core/util/arrayable"
import {Arrayable, Rect} from "core/types"
import {PointGeometry} from "core/geometry"
import {Context2d} from "core/util/canvas"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Line, Fill, Hatch} from "core/visuals"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {isArray, isTypedArray} from "core/util/types"
import {unreachable} from "core/util/assert"

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

        points.push({x0: min(xs), y0: min(ys), x1: max(xs), y1: max(ys), i})
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
        if (this._xs[i][j].length > 1) {
          for (let k = 1, endk = this._xs[i][j].length; k < endk; k++) {
            const xs = this._xs[i][j][k]  // only use holes
            const ys = this._ys[i][j][k]  // only use holes

            if (xs.length == 0)
              continue

            points.push({x0: min(xs), y0: min(ys), x1: max(xs), y1: max(ys), i})
          }
        }
      }
    }
    return new SpatialIndex(points)
  }

  protected _mask_data(): number[] {
    const xr = this.renderer.plot_view.frame.x_ranges.default
    const [x0, x1] = [xr.min, xr.max]

    const yr = this.renderer.plot_view.frame.y_ranges.default
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

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry

    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({x0: x, y0: y, x1: x, y1: y})
    const hole_candidates = this.hole_index.indices({x0: x, y0: y, x1: x, y1: y})

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

    unreachable()
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
              const [sx, sy] = this.map_to_screen(self[xname][i][j][k], self[yname][i][j][k])
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

  export type Props = Glyph.Props & LineVector & FillVector & HatchVector & {
    xs: p.CoordinateSeqSpec
    ys: p.CoordinateSeqSpec
  }

  export type Visuals = Glyph.Visuals & {line: Line, fill: Fill, hatch: Hatch}
}

export interface MultiPolygons extends MultiPolygons.Attrs {}

export class MultiPolygons extends Glyph {
  properties: MultiPolygons.Props

  constructor(attrs?: Partial<MultiPolygons.Attrs>) {
    super(attrs)
  }

  static init_MultiPolygons(): void {
    this.prototype.default_view = MultiPolygonsView

    this.coords([['xs', 'ys']])
    this.mixins(['line', 'fill', 'hatch'])
  }
}
