import {Annotation, AnnotationView} from "./annotation"
import * as mixins from "core/property_mixins"
import {Line} from "core/visuals"
import * as p from "core/properties"

export class SlopeView extends AnnotationView {
  model: Slope
  visuals: Slope.Visuals

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_render())
  }

  protected _render(): void {
    const {gradient, y_intercept} = this.model
    if (gradient == null || y_intercept == null)
      return

    const {frame} = this.plot_view

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    let sy_start, sy_end, sx_start, sx_end
    if (gradient == 0) {
      sy_start = yscale.compute(y_intercept)
      sy_end = sy_start

      sx_start = frame.bbox.left
      sx_end = sx_start + frame.bbox.width
    } else {
      sy_start = frame.bbox.top
      sy_end = sy_start + frame.bbox.height

      const y_start = yscale.invert(sy_start)
      const y_end = yscale.invert(sy_end)

      const x_start = (y_start - y_intercept) / gradient
      const x_end = (y_end - y_intercept) / gradient

      sx_start = xscale.compute(x_start)
      sx_end = xscale.compute(x_end)
    }

    const {ctx} = this.layer
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

  export type Props = Annotation.Props & {
    gradient: p.Property<number | null>
    y_intercept: p.Property<number | null>
  } & Mixins

  export type Mixins = mixins.Line/*Scalar*/

  export type Visuals = Annotation.Visuals & {line: Line}
}

export interface Slope extends Slope.Attrs {}

export class Slope extends Annotation {
  properties: Slope.Props
  __view_type__: SlopeView

  constructor(attrs?: Partial<Slope.Attrs>) {
    super(attrs)
  }

  static init_Slope(): void {
    this.prototype.default_view = SlopeView

    this.mixins<Slope.Mixins>(mixins.Line/*Scalar*/)

    this.define<Slope.Props>(({Number, Nullable}) => ({
      gradient:    [ Nullable(Number), null ],
      y_intercept: [ Nullable(Number), null ],
    }))

    this.override<Slope.Props>({
      line_color: 'black',
    })
  }
}
