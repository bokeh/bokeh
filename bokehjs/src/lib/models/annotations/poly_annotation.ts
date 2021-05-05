import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits} from "core/enums"
import {Arrayable} from "core/types"
import {CoordinateMapper} from "core/util/bbox"
import * as p from "core/properties"

export class PolyAnnotationView extends AnnotationView {
  override model: PolyAnnotation
  override visuals: PolyAnnotation.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_render())
  }

  protected _render(): void {
    const {xs, ys} = this.model

    if (xs.length != ys.length)
      return

    const n = xs.length
    if (n < 3)
      return

    const {frame} = this.plot_view
    const {ctx} = this.layer

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const {screen} = this.model
    function _calc_dim(values: Arrayable<number>, units: SpatialUnits, scale: Scale, view: CoordinateMapper): Arrayable<number> {
      if (screen)
        return values
      else
        return units == "data" ? scale.v_compute(values) : view.v_compute(values)
    }

    const sxs = _calc_dim(xs, this.model.xs_units, xscale, frame.bbox.xview)
    const sys = _calc_dim(ys, this.model.ys_units, yscale, frame.bbox.yview)

    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      ctx.lineTo(sxs[i], sys[i])
    }
    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
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
  override properties: PolyAnnotation.Props
  override __view_type__: PolyAnnotationView

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
    this.setv({xs, ys, screen: true}, {check_eq: false}) // XXX: because of inplace updates in tools
  }
}
