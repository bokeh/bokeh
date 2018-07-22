import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_legend} from "./utils"
import {LineMixinVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {StepMode} from "core/enums"
import * as p from "core/properties"
import * as hittest from "core/hittest"
import {PointGeometry} from "core/geometry"
import {Arrayable} from "core/types"
import {IBBox} from "core/util/bbox"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface StepData extends XYGlyphData {}

export interface StepView extends StepData {}

export class StepView extends XYGlyphView {
  model: Step
  visuals: Step.Visuals

  protected _get_points(i: number, sx: Arrayable<number>, sy: Arrayable<number>): number[][] {
    let x1: number, x2: number
    let y1: number, y2: number
    switch (this.model.mode) {
      case "before": {
        ;[x1, y1] = [sx[i-1], sy[i]]
        ;[x2, y2] = [sx[i],   sy[i]]
        break
      }
      case "after": {
        ;[x1, y1] = [sx[i], sy[i-1]]
        ;[x2, y2] = [sx[i], sy[i]  ]
        break
      }
      case "center": {
        const xm = (sx[i-1] + sx[i])/2
        ;[x1, y1] = [xm, sy[i-1]]
        ;[x2, y2] = [xm, sy[i]  ]
        break
      }
      default:
        throw new Error("unexpected")
    }
    return [[x1, y1], [x2, y2]]
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy}: StepData): void {
    let drawing = false
    let last_index: number | null = null

    this.visuals.line.set_value(ctx)

    const L = indices.length
    if (L < 2)
      return

    ctx.beginPath()
    ctx.moveTo(sx[0], sy[0])

    let x1: number, x2: number
    let y1: number, y2: number
    for (const i of indices) {
      [[x1, y1], [x2, y2]] = this._get_points(i, sx, sy)


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

      if (drawing) {
        ctx.lineTo(x1, y1)
        ctx.lineTo(x2, y2)
      } else {
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        drawing = true
      }

      last_index = i
    }

    ctx.lineTo(sx[L-1], sy[L-1])
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
      Output:
        Object with the following keys:
          * 0d (bool): whether the point hits the glyph or not
          * 1d (array(int)): array with the indices hit by the point
    */
    const result = hittest.create_empty_hit_test_result()
    const point = {x: geometry.sx, y: geometry.sy}
    const threshold = Math.max(2, this.visuals.line.line_width.value() / 2)

    let x1: number, x2: number
    let y1: number, y2: number
    let p0 = {x: NaN, y: NaN}
    for (let i = 0, end = this.sx.length-1; i < end; i++) {
      [[x1, y1], [x2, y2]] = this._get_points(i, this.sx, this.sy)
      const p1 = {x: x1, y: y1}
      const p2 = {x: x2, y: y2}
      const dist1 = hittest.dist_to_segment(point, p0, p1)
      const dist2 = hittest.dist_to_segment(point, p1, p2)

      if (dist1 < threshold || dist2 < threshold) {
        result.add_to_selected_glyphs(this.model)
        result.get_view = () => this
        result.line_indices = [i]
        break
      }
      p0 = p2
    }
    console.log(result.line_indices)
    return result
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Step {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    mode: StepMode
  }

  export interface Props extends XYGlyph.Props {}

  export interface Visuals extends XYGlyph.Visuals {
    line: Line
  }
}

export interface Step extends Step.Attrs {}

export class Step extends XYGlyph {

  properties: Step.Props

  constructor(attrs?: Partial<Step.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Step'
    this.prototype.default_view = StepView

    this.mixins(['line'])
    this.define({
      mode: [ p.StepMode, "before"],
    })
  }
}
Step.initClass()
