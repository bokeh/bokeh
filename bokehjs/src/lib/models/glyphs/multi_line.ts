import {SpatialIndex} from "core/util/spatial"
import {PointGeometry, SpanGeometry} from "core/geometry"
import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Arrayable, Rect, NumberArray} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {minmax} from "core/util/arrayable"
import {to_object} from "core/util/object"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_legend, line_interpolation} from "./utils"
import {Selection} from "../selections/selection"

export interface MultiLineData extends GlyphData {
  _xs: NumberArray[]
  _ys: NumberArray[]

  sxs: NumberArray[]
  sys: NumberArray[]
}

export interface MultiLineView extends MultiLineData {}

export class MultiLineView extends GlyphView {
  model: MultiLine
  visuals: MultiLine.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const xsi = this._xs[i]
      if (xsi.length == 0) {
        index.add_empty()
        continue
      }

      const ysi = this._ys[i]
      if (ysi.length == 0) {
        index.add_empty()
        continue
      }

      const [x0, x1] = minmax(xsi)
      const [y0, y1] = minmax(ysi)

      index.add(x0, y0, x1, y1)
    }
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
    const point = {x: geometry.sx, y: geometry.sy}
    let shortest = 9999

    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const threshold = Math.max(2, this.visuals.line.cache_select('line_width', i) / 2)

      let points: number[] | null = null
      for (let j = 0, endj = this.sxs[i].length-1; j < endj; j++) {
        const p0 = {x: this.sxs[i][j],   y: this.sys[i][j]  }
        const p1 = {x: this.sxs[i][j+1], y: this.sys[i][j+1]}
        const dist = hittest.dist_to_segment(point, p0, p1)
        if (dist < threshold && dist < shortest) {
          shortest = dist
          points = [j]
        }
      }
      if (points != null) {
        hits.set(i, points)
      }
    }

    return new Selection({
      indices: [...hits.keys()],
      multiline_indices: to_object(hits), // TODO: remove to_object()
    })
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let val: number
    let values: Arrayable<Arrayable<number>>
    if (geometry.direction === 'v') {
      val = this.renderer.yscale.invert(sy)
      values = this._ys
    } else {
      val = this.renderer.xscale.invert(sx)
      values = this._xs
    }

    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = values.length; i < end; i++) {
      const points: number[] = []
      for (let j = 0, endj = values[i].length-1; j < endj; j++) {
        if (values[i][j] <= val && val <= values[i][j+1])
          points.push(j)
      }
      if (points.length > 0) {
        hits.set(i, points)
      }
    }

    return new Selection({
      indices: [...hits.keys()],
      multiline_indices: to_object(hits), // TODO: remove to_object()
    })
  }

  get_interpolation_hit(i: number, point_i: number, geometry: PointGeometry | SpanGeometry): [number, number] {
    const [x2, y2, x3, y3] = [this._xs[i][point_i], this._ys[i][point_i], this._xs[i][point_i+1], this._ys[i][point_i+1]]
    return line_interpolation(this.renderer, geometry, x2, y2, x3, y3)
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(): [number, number] {
    throw new Error(`${this}.scenterxy() is not implemented`)
  }
}

export namespace MultiLine {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    xs: p.CoordinateSeqSpec
    ys: p.CoordinateSeqSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: Line}
}

export interface MultiLine extends MultiLine.Attrs {}

export class MultiLine extends Glyph {
  properties: MultiLine.Props
  __view_type__: MultiLineView

  constructor(attrs?: Partial<MultiLine.Attrs>) {
    super(attrs)
  }

  static init_MultiLine(): void {
    this.prototype.default_view = MultiLineView

    this.define<MultiLine.Props>({
      xs: [ p.CoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.CoordinateSeqSpec, {field: "ys"} ],
    })
    this.mixins<MultiLine.Mixins>(LineVector)
  }
}
