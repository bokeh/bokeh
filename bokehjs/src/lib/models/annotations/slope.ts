import {Annotation, AnnotationView} from "./annotation"
import {LineScalar} from "core/property_mixins"
import {Line} from "core/visuals"
import {Color} from "core/types"
import * as p from "core/properties"

export class SlopeView extends AnnotationView {
  model: Slope
  visuals: Slope.Visuals

  initialize(): void {
    super.initialize()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_render())
  }

  render(): void {
    if (!this.model.visible)
      return
    this._draw_slope()
  }

  protected _draw_slope(): void {
    const gradient = this.model.gradient
    const y_intercept = this.model.y_intercept
    if(gradient == null || y_intercept == null){
      return
    }

    const {frame} = this.plot_view
    const {x_scale, y_scale} = this.scope

    const sy_start = frame._top.value
    const sy_end = sy_start + frame._height.value

    const y_start = y_scale.invert(sy_start)
    const y_end = y_scale.invert(sy_end)

    const x_start = (y_start - y_intercept) / gradient
    const x_end = (y_end - y_intercept) / gradient

    const sx_start = x_scale.compute(x_start)
    const sx_end = x_scale.compute(x_end)

    const {ctx} = this.plot_view.canvas_view
    ctx.save()

    ctx.beginPath()
    this.visuals.line.set_value(ctx)
    ctx.moveTo(sx_start, sy_start)
    ctx.lineTo(sx_end, sy_end)

    ctx.stroke()
    ctx.restore()
  }
}

export namespace Slope {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & LineScalar & {
    gradient: p.Property<number | null>
    y_intercept: p.Property<number | null>

    line_color: p.Property<Color>
    line_width: p.Property<number>
    line_alpha: p.Property<number>
  }

  export type Visuals = Annotation.Visuals & {line: Line}
}

export interface Slope extends Slope.Attrs {}

export class Slope extends Annotation {
  properties: Slope.Props

  constructor(attrs?: Partial<Slope.Attrs>) {
    super(attrs)
  }

  static init_Slope(): void {
    this.prototype.default_view = SlopeView

    this.mixins(['line'])

    this.define<Slope.Props>({
      gradient:       [ p.Number,       null      ],
      y_intercept:    [ p.Number,       null      ],
    })

    this.override({
      line_color: 'black',
    })

  }
}
