import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_line_scalar_legend} from "./utils"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Rect} from "core/types"
import {StepMode} from "core/enums"
import {Context2d} from "core/util/canvas"

export type StepData = XYGlyphData

export interface StepView extends StepData {}

export class StepView extends XYGlyphView {
  model: Step
  visuals: Step.Visuals

  protected _render(ctx: Context2d, indices: number[], data?: StepData): void {
    const {sx, sy} = data ?? this

    let drawing = false
    let last_index: number | null = null

    this.visuals.line.set_value(ctx)

    const L = indices.length
    if (L < 2)
      return

    ctx.beginPath()
    ctx.moveTo(sx[0], sy[0])

    for (const i of indices) {
      let x1: number, x2: number
      let y1: number, y2: number
      switch (this.model.mode) {
        case "before": {
          [x1, y1] = [sx[i-1], sy[i]]
          ;[x2, y2] = [sx[i],   sy[i]]
          break
        }
        case "after": {
          [x1, y1] = [sx[i], sy[i-1]]
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

  draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_line_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace Step {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    mode: p.Property<StepMode>
  } & Mixins

  export type Mixins = mixins.LineScalar

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineScalar}
}

export interface Step extends Step.Attrs {}

export class Step extends XYGlyph {
  properties: Step.Props
  __view_type__: StepView

  constructor(attrs?: Partial<Step.Attrs>) {
    super(attrs)
  }

  static init_Step(): void {
    this.prototype.default_view = StepView

    this.mixins<Step.Mixins>(mixins.LineScalar)
    this.define<Step.Props>(() => ({
      mode: [ StepMode, "before" ],
    }))
  }
}
