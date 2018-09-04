import {IBBox} from "core/util/bbox"
import {SpatialIndex} from "core/util/spatial"
import {PointGeometry, SpanGeometry} from "core/geometry"
import {NumberSpec} from "core/vectorization"
import {LineMixinVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Arrayable} from "core/types"
import * as hittest from "core/hittest"
import {keys} from "core/util/object"
import {min, max} from "core/util/array"
import {isStrictNaN} from "core/util/types"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_legend, line_interpolation} from "./utils"
import {Selection} from "../selections/selection"

export interface MultiLineData extends GlyphData {
  _xs: Arrayable<Arrayable<number>>
  _ys: Arrayable<Arrayable<number>>

  sxs: Arrayable<Arrayable<number>>
  sys: Arrayable<Arrayable<number>>
}

export interface MultiLineView extends MultiLineData {}

export class MultiLineView extends GlyphView {
  model: MultiLine
  visuals: MultiLine.Visuals

  protected _index_data(): SpatialIndex {
    const points = []
    for (let i = 0, end = this._xs.length; i < end; i++) {
      if (this._xs[i] == null || this._xs[i].length === 0)
        continue

      const _xsi = this._xs[i]
      const xs: number[] = []
      for (let j = 0, n = _xsi.length; j < n; j++) {
        const x = _xsi[j]
        if (!isStrictNaN(x))
          xs.push(x)
      }

      const _ysi = this._ys[i]
      const ys: number[] = []
      for (let j = 0, n = _ysi.length; j < n; j++) {
        const y = _ysi[j]
        if (!isStrictNaN(y))
          ys.push(y)
      }

      const [minX, maxX] = [min(xs), max(xs)]
      const [minY, maxY] = [min(ys), max(ys)]

      points.push({minX, minY, maxX, maxY, i})
    }

    return new SpatialIndex(points)
  }

  protected _render(ctx: Context2d, indices: number[], {sxs, sys}: MultiLineData): void {
    for (const i of indices) {
      const [sx, sy] = [sxs[i], sys[i]]

      this.visuals.line.set_vectorize(ctx, i)
      for (let j = 0, end = sx.length; j < end; j++) {
        if (j == 0) {
          ctx.beginPath()
          ctx.moveTo(sx[j], sy[j])
          continue
        } else if (isNaN(sx[j]) || isNaN(sy[j])) {
          ctx.stroke()
          ctx.beginPath()
          continue
        } else
          ctx.lineTo(sx[j], sy[j])
      }
      ctx.stroke()
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const result = hittest.create_empty_hit_test_result()
    const point = {x: geometry.sx, y: geometry.sy}
    let shortest = 9999

    const hits: {[key: string]: number[]} = {}
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const threshold = Math.max(2, this.visuals.line.cache_select('line_width', i) / 2)
      let points = null
      for (let j = 0, endj = this.sxs[i].length-1; j < endj; j++) {
        const p0 = {x: this.sxs[i][j],   y: this.sys[i][j]  }
        const p1 = {x: this.sxs[i][j+1], y: this.sys[i][j+1]}
        const dist = hittest.dist_to_segment(point, p0, p1)
        if (dist < threshold && dist < shortest) {
          shortest = dist
          points = [j]
        }
      }
      if (points)
        hits[i] = points
    }

    result.indices = keys(hits).map((x) => parseInt(x, 10))
    result.multiline_indices = hits

    return result
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const result = hittest.create_empty_hit_test_result()

    let val: number
    let values: Arrayable<Arrayable<number>>
    if (geometry.direction === 'v') {
      val = this.renderer.yscale.invert(sy)
      values = this._ys
    } else {
      val = this.renderer.xscale.invert(sx)
      values = this._xs
    }

    const hits: {[key: string]: number[]} = {}
    for (let i = 0, end = values.length; i < end; i++) {
      const points = []
      for (let j = 0, endj = values[i].length-1; j < endj; j++) {
        if (values[i][j] <= val && val <= values[i][j+1])
          points.push(j)
      }
      if (points.length > 0)
        hits[i] = points
    }

    result.indices = keys(hits).map((x) => parseInt(x, 10))
    result.multiline_indices = hits

    return result
  }

  get_interpolation_hit(i: number, point_i: number, geometry: PointGeometry | SpanGeometry): [number, number] {
    const [x2, y2, x3, y3] = [this._xs[i][point_i], this._ys[i][point_i], this._xs[i][point_i+1], this._ys[i][point_i+1]]
    return line_interpolation(this.renderer, geometry, x2, y2, x3, y3)
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }

  scenterx(): number {
    throw new Error("not implemented")
  }

  scentery(): number {
    throw new Error("not implemented")
  }
}

export namespace MultiLine {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends Glyph.Attrs, Mixins {
    xs: NumberSpec
    ys: NumberSpec
  }

  export interface Props extends Glyph.Props {}

  export interface Visuals extends Glyph.Visuals {
    line: Line
  }
}

export interface MultiLine extends MultiLine.Attrs {}

export class MultiLine extends Glyph {

  properties: MultiLine.Props

  constructor(attrs?: Partial<MultiLine.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'MultiLine'
    this.prototype.default_view = MultiLineView

    this.coords([['xs', 'ys']])
    this.mixins(['line'])
  }
}
MultiLine.initClass()
