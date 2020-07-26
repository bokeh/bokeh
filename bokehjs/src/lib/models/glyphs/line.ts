import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_legend, line_interpolation} from "./utils"
import {LineGL} from "./webgl/line"
import {PointGeometry, SpanGeometry} from "core/geometry"
import {Arrayable, Rect} from "core/types"
import * as p from "core/properties"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as hittest from "core/hittest"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface LineData extends XYGlyphData {}

export interface LineView extends LineData {}

export class LineView extends XYGlyphView {
  model: Line
  visuals: Line.Visuals

  /** @internal */
  glglyph?: LineGL

  initialize(): void {
    super.initialize()

    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null) {
      this.glglyph = new LineGL(webgl.gl, this)
    }
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy}: LineData): void {
    let drawing = false
    let last_index: number | null = null

    this.visuals.line.set_value(ctx)
    for (const i of indices) {
      if (drawing) {
        if (!isFinite(sx[i] + sy[i])) {
          ctx.stroke()
          ctx.beginPath()
          drawing = false
          last_index = i
          continue
        }

        if (last_index != null && i - last_index > 1) {
          ctx.stroke()
          drawing = false
        }
      }

      if (drawing)
        ctx.lineTo(sx[i], sy[i])
      else {
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        drawing = true
      }

      last_index = i
    }

    if (drawing)
      ctx.stroke()
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    /* Check if the point geometry hits this line glyph and return an object
    that describes the hit result:
      Args:
        * geometry (object): object with the following keys
          * sx (float): screen x coordinate of the point
          * sy (float): screen y coordinate of the point
          * type (str): type of geometry (in this case it's a point)
    */
    const result = new Selection()
    const point = {x: geometry.sx, y: geometry.sy}
    let shortest = 9999
    const threshold = Math.max(2, this.visuals.line.line_width.value() / 2)

    for (let i = 0, end = this.sx.length-1; i < end; i++) {
      const p0 = {x: this.sx[i],     y: this.sy[i]    }
      const p1 = {x: this.sx[i + 1], y: this.sy[i + 1]}
      const dist = hittest.dist_to_segment(point, p0, p1)

      if (dist < threshold && dist < shortest) {
        shortest = dist
        result.add_to_selected_glyphs(this.model)
        result.view = this
        result.line_indices = [i]
      }
    }

    return result
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const result = new Selection()

    let val: number
    let values: Arrayable<number>
    if (geometry.direction == 'v') {
      val = this.renderer.yscale.invert(sy)
      values = this._y
    } else {
      val = this.renderer.xscale.invert(sx)
      values = this._x
    }

    for (let i = 0, end = values.length-1; i < end; i++) {
      if ((values[i] <= val && val <= values[i + 1]) || (values[i + 1] <= val && val <= values[i])) {
        result.add_to_selected_glyphs(this.model)
        result.view = this
        result.line_indices.push(i)
      }
    }

    return result
  }

  get_interpolation_hit(i: number, geometry: PointGeometry | SpanGeometry): [number, number] {
    const [x2, y2, x3, y3] = [this._x[i], this._y[i], this._x[i+1], this._y[i+1]]
    return line_interpolation(this.renderer, geometry, x2, y2, x3, y3)
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Line {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & Mixins

  export type Mixins = mixins.Line/*Scalar*/

  export type Visuals = XYGlyph.Visuals & {line: visuals.Line}
}

export interface Line extends Line.Attrs {}

export class Line extends XYGlyph {
  properties: Line.Props
  __view_type__: LineView

  constructor(attrs?: Partial<Line.Attrs>) {
    super(attrs)
  }

  static init_Line(): void {
    this.prototype.default_view = LineView

    this.mixins<Line.Mixins>(mixins.Line/*Scalar*/)
  }
}
