import {Annotation, AnnotationView} from "./annotation"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"

export class SlopeView extends AnnotationView {
  override model: Slope
  override visuals: Slope.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {gradient, y_intercept} = this.model
    if (gradient == null || y_intercept == null)
      return

    const {x_scale, y_scale} = this.coordinates
    const {bbox} = this.parent

    let sy_start, sy_end, sx_start, sx_end
    if (gradient == 0) {
      sy_start = y_scale.compute(y_intercept)
      sy_end = sy_start

      sx_start = bbox.left
      sx_end = sx_start + bbox.width
    } else {
      sy_start = bbox.top
      sy_end = sy_start + bbox.height

      const y_start = y_scale.invert(sy_start)
      const y_end = y_scale.invert(sy_end)

      const x_start = (y_start - y_intercept) / gradient
      const x_end = (y_end - y_intercept) / gradient

      sx_start = x_scale.compute(x_start)
      sx_end = x_scale.compute(x_end)
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

  export type Mixins = mixins.Line

  export type Visuals = Annotation.Visuals & {line: visuals.Line}
}

export interface Slope extends Slope.Attrs {}

export class Slope extends Annotation {
  override properties: Slope.Props
  override __view_type__: SlopeView

  constructor(attrs?: Partial<Slope.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SlopeView

    this.mixins<Slope.Mixins>(mixins.Line)

    this.define<Slope.Props>(({Number, Nullable}) => ({
      gradient:    [ Nullable(Number), null ],
      y_intercept: [ Nullable(Number), null ],
    }))

    this.override<Slope.Props>({
      line_color: "black",
    })
  }
}
