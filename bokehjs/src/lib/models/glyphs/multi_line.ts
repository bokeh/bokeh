import type {SpatialIndex} from "core/util/spatial"
import type {PointGeometry, SpanGeometry} from "core/geometry"
import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect, RaggedArray, FloatArray} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {minmax2} from "core/util/arrayable"
import type {Context2d} from "core/util/canvas"
import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend, line_interpolation} from "./utils"
import {Selection} from "../selections/selection"
import type {MultiLineGL} from "./webgl/multi_line"

export interface MultiLineView extends MultiLine.Data {}

export class MultiLineView extends GlyphView {
  declare model: MultiLine
  declare visuals: MultiLine.Visuals

  /** @internal */
  declare glglyph?: MultiLineGL

  override async load_glglyph() {
    const {MultiLineGL} = await import("./webgl/multi_line")
    return MultiLineGL
  }

  protected override _project_data(): void {
    this._project_xy<MultiLine.Data>("xs", this.xs.data, "ys", this.ys.data)
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

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<MultiLine.Data>): void {
    const {sxs, sys} = {...this, ...data}

    for (const i of indices) {
      const sx = sxs.get(i)
      const sy = sys.get(i)

      const n = Math.min(sx.length, sy.length)

      let move = true
      ctx.beginPath()

      for (let j = 0; j < n; j++) {
        const sx_j = sx[j]
        const sy_j = sy[j]

        if (!isFinite(sx_j + sy_j)) {
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

      this.visuals.line.set_vectorize(ctx, i)
      ctx.stroke()
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const point = {x: geometry.sx, y: geometry.sy}
    let shortest = 9999

    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const threshold = Math.max(2, this.line_width.get(i)/2)

      const sxsi = this.sxs.get(i)
      const sysi = this.sys.get(i)

      let points: number[] | null = null
      for (let j = 0, endj = sxsi.length - 1; j < endj; j++) {
        const p0 = {x: sxsi[j],   y: sysi[j]}
        const p1 = {x: sxsi[j+1], y: sysi[j+1]}
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
      multiline_indices: hits,
    })
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let val: number
    let vs: RaggedArray<FloatArray>
    if (geometry.direction == "v") {
      val = this.renderer.yscale.invert(sy)
      vs = this.ys
    } else {
      val = this.renderer.xscale.invert(sx)
      vs = this.xs
    }

    const hits: Map<number, number[]> = new Map()
    for (let i = 0, end = vs.length; i < end; i++) {
      const vsi = vs.get(i)
      const points: number[] = []
      for (let j = 0, endj = vsi.length - 1; j < endj; j++) {
        if (vsi[j] <= val && val <= vsi[j + 1]) {
          points.push(j)
        }
      }
      if (points.length > 0) {
        hits.set(i, points)
      }
    }

    return new Selection({
      indices: [...hits.keys()],
      multiline_indices: hits,
    })
  }

  get_interpolation_hit(i: number, point_i: number, geometry: PointGeometry | SpanGeometry): [number, number] {
    const xsi = this.xs.get(i)
    const ysi = this.ys.get(i)
    const x2 = xsi[point_i]
    const y2 = ysi[point_i]
    const x3 = xsi[point_i + 1]
    const y3 = ysi[point_i + 1]
    return line_interpolation(this.renderer, geometry, x2, y2, x3, y3)
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
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

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props>
}

export interface MultiLine extends MultiLine.Attrs {}

export class MultiLine extends Glyph {
  declare properties: MultiLine.Props
  declare __view_type__: MultiLineView

  constructor(attrs?: Partial<MultiLine.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultiLineView

    this.define<MultiLine.Props>(({}) => ({
      xs: [ p.XCoordinateSeqSpec, {field: "xs"} ],
      ys: [ p.YCoordinateSeqSpec, {field: "ys"} ],
    }))
    this.mixins<MultiLine.Mixins>(LineVector)
  }
}
