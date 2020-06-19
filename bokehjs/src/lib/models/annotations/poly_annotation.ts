import {Annotation, AnnotationView} from "./annotation"
import * as mixins from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {SpatialUnits} from "core/enums"
import {Signal0} from "core/signaling"
import * as p from "core/properties"

export class PolyAnnotationView extends AnnotationView {
  model: PolyAnnotation
  visuals: PolyAnnotation.Visuals

  connect_signals(): void {
    super.connect_signals()
    // need to respond to either normal BB change events or silent
    // "data only updates" that tools might want to use
    this.connect(this.model.change, () => this.plot_view.request_render())
    this.connect(this.model.data_update, () => this.plot_view.request_render())
  }

  protected _render(): void {
    const {xs, ys} = this.model

    if (xs.length != ys.length)
      return

    if (xs.length < 3 || ys.length < 3)
      return

    const {frame} = this.plot_view
    const {ctx} = this.layer

    for (let i = 0, end = xs.length; i < end; i++) {
      let sx: number
      if (this.model.xs_units == 'screen')
        sx = this.model.screen ? xs[i] : frame.xview.compute(xs[i])
      else
        throw new Error("not implemented")

      let sy: number
      if (this.model.ys_units == 'screen')
        sy = this.model.screen ? ys[i] : frame.yview.compute(ys[i])
      else
        throw new Error("not implemented")

      if (i == 0) {
        ctx.beginPath()
        ctx.moveTo(sx, sy)
      } else {
        ctx.lineTo(sx, sy)
      }
    }

    ctx.closePath()

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
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

  export type Mixins = mixins.Line/*Scalar*/ & mixins.Fill/*Scalar*/

  export type Visuals = Annotation.Visuals & {line: Line, fill: Fill}
}

export interface PolyAnnotation extends PolyAnnotation.Attrs {}

export class PolyAnnotation extends Annotation {
  properties: PolyAnnotation.Props
  __view_type__: PolyAnnotationView

  data_update: Signal0<this>

  constructor(attrs?: Partial<PolyAnnotation.Attrs>) {
    super(attrs)
  }

  static init_PolyAnnotation(): void {
    this.prototype.default_view = PolyAnnotationView

    this.mixins<PolyAnnotation.Mixins>([mixins.Line/*Scalar*/, mixins.Fill/*Scalar*/])

    this.define<PolyAnnotation.Props>({
      xs:           [ p.Array,        []        ],
      xs_units:     [ p.SpatialUnits, 'data'    ],
      ys:           [ p.Array,        []        ],
      ys_units:     [ p.SpatialUnits, 'data'    ],
    })

    this.internal({
      screen: [ p.Boolean, false ],
    })

    this.override({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }

  initialize(): void {
    super.initialize()
    this.data_update = new Signal0(this, "data_update")
  }

  update({xs, ys}: {xs: number[], ys: number[]}): void {
    this.setv({xs, ys, screen: true}, {silent: true})
    this.data_update.emit()
  }
}
