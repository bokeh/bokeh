import {Annotation, AnnotationView} from "./annotation"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import * as p from "core/properties"

export class PolyAnnotationView extends AnnotationView {
  model: PolyAnnotation
  visuals: PolyAnnotation.Visuals

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {xs, ys} = this.model

    if (xs.length != ys.length)
      return

    if (xs.length < 3 || ys.length < 3)
      return

    const {frame} = this.plot_view
    const {ctx} = this.layer

    ctx.beginPath()
    for (let i = 0, end = xs.length; i < end; i++) {
      let sx: number
      if (this.model.xs_units == 'screen')
        sx = this.model.screen ? xs[i] : frame.bbox.xview.compute(xs[i])
      else
        throw new Error("not implemented")

      let sy: number
      if (this.model.ys_units == 'screen')
        sy = this.model.screen ? ys[i] : frame.bbox.yview.compute(ys[i])
      else
        throw new Error("not implemented")

      ctx.lineTo(sx, sy)
    }
    ctx.closePath()

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.hatch.doit) {
      this.visuals.hatch.set_value(ctx)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }
  }
}

export namespace PolyAnnotation {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    xs: p.Property<number[]>
    xs_units: p.Property<SpatialUnits>
    ys: p.Property<number[]>
    ys_units: p.Property<SpatialUnits>
    screen: p.Property<boolean>
  } & Mixins

  export type Mixins = mixins.Line & mixins.Fill & mixins.Hatch

  export type Visuals = Annotation.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
}

export interface PolyAnnotation extends PolyAnnotation.Attrs {}

export class PolyAnnotation extends Annotation {
  properties: PolyAnnotation.Props
  __view_type__: PolyAnnotationView

  constructor(attrs?: Partial<PolyAnnotation.Attrs>) {
    super(attrs)
  }

  static init_PolyAnnotation(): void {
    this.prototype.default_view = PolyAnnotationView

    this.mixins<PolyAnnotation.Mixins>([mixins.Line, mixins.Fill, mixins.Hatch])

    this.define<PolyAnnotation.Props>(({Number, Array}) => ({
      xs:           [ Array(Number), [] ],
      xs_units:     [ SpatialUnits, "data" ],
      ys:           [ Array(Number), [] ],
      ys_units:     [ SpatialUnits, "data" ],
    }))

    this.internal<PolyAnnotation.Props>(({Boolean}) => ({
      screen: [ Boolean, false ],
    }))

    this.override<PolyAnnotation.Props>({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }

  update({xs, ys}: {xs: number[], ys: number[]}): void {
    this.setv({xs, ys, screen: true})
  }
}
