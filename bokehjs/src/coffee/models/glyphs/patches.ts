import {IBBox} from "core/util/bbox"
import {SpatialIndex} from "core/util/spatial"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_legend} from "./utils"
import {min, max, copy, findLastIndex} from "core/util/array"
import {sum} from "core/util/arrayable"
import {isStrictNaN} from "core/util/types"
import {Arrayable} from "core/types"
import {PointGeometry} from "core/geometry"
import {Context2d} from "core/util/canvas"
import {NumberSpec} from "core/vectorization"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import * as hittest from "core/hittest"
import {Selection} from "../selections/selection"

export interface PatchesData extends GlyphData {
  _xs: Arrayable<Arrayable<number>>
  _ys: Arrayable<Arrayable<number>>

  sxs: Arrayable<Arrayable<number>>
  sys: Arrayable<Arrayable<number>>

  sxss: number[][][]
  syss: number[][][]
}

export interface PatchesView extends PatchesData {}

export class PatchesView extends GlyphView {
  model: Patches
  visuals: Patches.Visuals

  private _build_discontinuous_object(nanned_qs: number[][]): number[][][] {
    // _s is this.xs, this.ys, this.sxs, this.sys
    // an object of n 1-d arrays in either data or screen units
    //
    // Each 1-d array gets broken to an array of arrays split
    // on any NaNs
    //
    // So:
    // { 0: [x11, x12],
    //   1: [x21, x22, x23],
    //   2: [x31, NaN, x32]
    // }
    // becomes
    // { 0: [[x11, x12]],
    //   1: [[x21, x22, x23]],
    //   2: [[x31],[x32]]
    // }
    const ds: number[][][] = []
    for (let i = 0, end = nanned_qs.length; i < end; i++) {
      ds[i] = []
      let qs = copy(nanned_qs[i])
      while (qs.length > 0) {
        const nan_index = findLastIndex(qs, (q) => isStrictNaN(q))

        let qs_part
        if (nan_index >= 0)
          qs_part = qs.splice(nan_index)
        else {
          qs_part = qs
          qs = []
        }

        const denanned = qs_part.filter((q) => !isStrictNaN(q))
        ds[i].push(denanned)
      }
    }
    return ds
  }


  protected _index_data(): SpatialIndex {
    const xss = this._build_discontinuous_object(this._xs as any) // XXX
    const yss = this._build_discontinuous_object(this._ys as any) // XXX

    const points = []
    for (let i = 0, end = this._xs.length; i < end; i++) {
      for (let j = 0, endj = xss[i].length; j < endj; j++) {
        const xs = xss[i][j]
        const ys = yss[i][j]

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

    return new SpatialIndex(points)
  }

  protected _mask_data(): number[] {
    const xr = this.renderer.plot_view.frame.x_ranges["default"]
    const [x0, x1] = [xr.min, xr.max]

    const yr = this.renderer.plot_view.frame.y_ranges["default"]
    const [y0, y1] = [yr.min, yr.max]

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    const indices = this.index.indices(bbox)

    // TODO (bev) this should be under test
    return indices.sort((a, b) => a - b)
  }

  protected _render(ctx: Context2d, indices: number[], {sxs, sys}: PatchesData): void {
    // this.sxss and this.syss are used by _hit_point and sxc, syc
    // This is the earliest we can build them, and only build them once
    this.sxss = this._build_discontinuous_object(sxs as any) // XXX
    this.syss = this._build_discontinuous_object(sys as any) // XXX

    for (const i of indices) {
      const [sx, sy] = [sxs[i], sys[i]]

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)

        for (let j = 0, end = sx.length; j < end; j++) {
          if (j == 0) {
            ctx.beginPath()
            ctx.moveTo(sx[j], sy[j])
            continue
          } else if (isNaN(sx[j] + sy[j])) {
            ctx.closePath()
            ctx.fill()
            ctx.beginPath()
            continue
          } else
            ctx.lineTo(sx[j], sy[j])
        }

        ctx.closePath()
        ctx.fill()
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)

        for (let j = 0, end = sx.length; j < end; j++) {
          if (j == 0) {
            ctx.beginPath()
            ctx.moveTo(sx[j], sy[j])
            continue
          } else if (isNaN(sx[j] + sy[j])) {
            ctx.closePath()
            ctx.stroke()
            ctx.beginPath()
            continue
          } else
            ctx.lineTo(sx[j], sy[j])
        }

        ctx.closePath()
        ctx.stroke()
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry

    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const candidates = this.index.indices({minX: x, minY: y, maxX: x, maxY: y})

    const hits = []
    for (let i = 0, end = candidates.length; i < end; i++) {
      const idx = candidates[i]
      const sxs = this.sxss[idx]
      const sys = this.syss[idx]
      for (let j = 0, endj = sxs.length; j < endj; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j], sys[j])) {
          hits.push(idx)
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
    if (this.sxss[i].length == 1) {
      // We don't have discontinuous objects so we're ok
      return this._get_snap_coord(this.sxs[i])
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.sxss[i]
      const sys = this.syss[i]
      for (let j = 0, end = sxs.length; j < end; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j], sys[j]))
          return this._get_snap_coord(sxs[j])
      }
    }

    throw new Error("unreachable code")
  }

  scentery(i: number, sx: number, sy: number): number {
    if (this.syss[i].length == 1) {
      // We don't have discontinuous objects so we're ok
      return this._get_snap_coord(this.sys[i])
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.sxss[i]
      const sys = this.syss[i]
      for (let j = 0, end = sxs.length; j < end; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j], sys[j]))
          return this._get_snap_coord(sys[j])
      }
    }

    throw new Error("unreachable code")
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Patches {
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

export interface Patches extends Patches.Attrs {}

export class Patches extends Glyph {

  properties: Patches.Props

  constructor(attrs?: Partial<Patches.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Patches'
    this.prototype.default_view = PatchesView

    this.coords([['xs', 'ys']])
    this.mixins(['line', 'fill'])
  }
}
Patches.initClass()
