import {Annotation, AnnotationView} from "./annotation"
import {Scale} from "../scales/scale"
import * as mixins from "core/property_mixins"
import * as visuals from "core/visuals"
import {SpatialUnits, RenderMode, Dimension} from "core/enums"
import * as p from "core/properties"
import {CoordinateMapper} from "core/util/bbox"

export class SpanView extends AnnotationView {
  model: Span
  visuals: Span.Visuals

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.plot_view.request_paint(this))
  }

  protected _render(): void {
    const {location} = this.model
    if (location == null) {
      return
    }

    const {frame} = this.plot_view

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const _calc_dim = (scale: Scale, view: CoordinateMapper): number => {
      if (this.model.location_units == 'data')
        return scale.compute(location)
      else
        return this.model.for_hover ? location : view.compute(location)
    }

    let height: number, sleft: number, stop: number, width: number
    if (this.model.dimension == 'width') {
      stop = _calc_dim(yscale, frame.bbox.yview)
      sleft = frame.bbox.left
      width = frame.bbox.width
      height = this.model.properties.line_width.value()
    } else {
      stop = frame.bbox.top
      sleft = _calc_dim(xscale, frame.bbox.xview)
      width = this.model.properties.line_width.value()
      height = frame.bbox.height
    }

    const {ctx} = this.layer
    ctx.save()

    ctx.beginPath()
    this.visuals.line.set_value(ctx)
    ctx.moveTo(sleft, stop)
    if (this.model.dimension == "width") {
      ctx.lineTo(sleft + width, stop)
    } else {
      ctx.lineTo(sleft, stop + height)
    }
    ctx.stroke()

    ctx.restore()
  }
}

export namespace Span {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    render_mode: p.Property<RenderMode>
    location: p.Property<number | null>
    location_units: p.Property<SpatialUnits>
    dimension: p.Property<Dimension>
    for_hover: p.Property<boolean>
  } & Mixins

  export type Mixins = mixins.Line/*Scalar*/

  export type Visuals = Annotation.Visuals & {line: visuals.Line/*Scalar*/}
}

export interface Span extends Span.Attrs {}

export class Span extends Annotation {
  properties: Span.Props
  __view_type__: SpanView

  constructor(attrs?: Partial<Span.Attrs>) {
    super(attrs)
  }

  static init_Span(): void {
    this.prototype.default_view = SpanView

    this.mixins<Span.Mixins>(mixins.Line/*Scalar*/)

    this.define<Span.Props>(({Number, Nullable}) => ({
      render_mode:    [ RenderMode, "canvas" ],
      location:       [ Nullable(Number), null ],
      location_units: [ SpatialUnits, "data" ],
      dimension:      [ Dimension, "width" ],
    }))

    this.internal<Span.Props>(({Boolean}) => ({
      for_hover: [ Boolean, false ],
    }))

    this.override<Span.Props>({
      line_color: 'black',
    })
  }
}
