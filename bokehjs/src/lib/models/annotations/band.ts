import {Annotation, AnnotationView} from "./annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import * as mixins from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {Arrayable} from "core/types"
import {Dimension} from "core/enums"
import * as p from "core/properties"

export class BandView extends AnnotationView {
  model: Band
  visuals: Band.Visuals

  protected _lower: Arrayable<number>
  protected _upper: Arrayable<number>
  protected _base:  Arrayable<number>

  protected max_lower: number
  protected max_upper: number
  protected max_base:  number

  protected _lower_sx: Arrayable<number>
  protected _lower_sy: Arrayable<number>
  protected _upper_sx: Arrayable<number>
  protected _upper_sy: Arrayable<number>

  initialize(): void {
    super.initialize()
    this.set_data(this.model.source)
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.source.streaming, () => this.set_data(this.model.source))
    this.connect(this.model.source.patching, () => this.set_data(this.model.source))
    this.connect(this.model.source.change, () => this.set_data(this.model.source))
  }

  set_data(source: ColumnarDataSource): void {
    super.set_data(source)
    this.visuals.warm_cache(source)
    this.plot_view.request_render()
  }

  protected _map_data(): void {
    const {frame} = this.plot_view
    const dim = this.model.dimension

    const xscale = this.scope.x_scale
    const yscale = this.scope.y_scale

    const limit_scale = dim == "height" ? yscale : xscale
    const base_scale  = dim == "height" ? xscale : yscale

    const limit_view = dim == "height" ? frame.yview : frame.xview
    const base_view  = dim == "height" ? frame.xview : frame.yview

    let _lower_sx
    if (this.model.properties.lower.units == "data")
      _lower_sx = limit_scale.v_compute(this._lower)
    else
      _lower_sx = limit_view.v_compute(this._lower)

    let _upper_sx
    if (this.model.properties.upper.units == "data")
      _upper_sx = limit_scale.v_compute(this._upper)
    else
      _upper_sx = limit_view.v_compute(this._upper)

    let _base_sx
    if (this.model.properties.base.units  == "data")
      _base_sx  = base_scale.v_compute(this._base)
    else
      _base_sx  = base_view.v_compute(this._base)

    const [i, j] = dim == 'height' ? [1, 0] : [0, 1]

    const _lower = [_lower_sx, _base_sx]
    const _upper = [_upper_sx, _base_sx]

    this._lower_sx = _lower[i]
    this._lower_sy = _lower[j]

    this._upper_sx = _upper[i]
    this._upper_sy = _upper[j]
  }

  protected _render(): void {
    this._map_data()

    const {ctx} = this.layer

    // Draw the band body
    ctx.beginPath()
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0])

    for (let i = 0, end = this._lower_sx.length; i < end; i++) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = this._upper_sx.length-1; i >= 0; i--) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
    }

    ctx.closePath()

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      ctx.fill()
    }

    // Draw the lower band edge
    ctx.beginPath()
    ctx.moveTo(this._lower_sx[0], this._lower_sy[0])
    for (let i = 0, end = this._lower_sx.length; i < end; i++) {
      ctx.lineTo(this._lower_sx[i], this._lower_sy[i])
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }

    // Draw the upper band edge
    ctx.beginPath()
    ctx.moveTo(this._upper_sx[0], this._upper_sy[0])
    for (let i = 0, end = this._upper_sx.length; i < end; i++) {
      ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_value(ctx)
      ctx.stroke()
    }
  }
}

export namespace Band {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    lower: p.DistanceSpec
    upper: p.DistanceSpec
    base: p.DistanceSpec
    dimension: p.Property<Dimension>
    source: p.Property<ColumnarDataSource>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
  } & Mixins

  export type Mixins = mixins.Line/*Scalar*/ & mixins.Fill/*Scalar*/

  export type Visuals = Annotation.Visuals & {line: Line, fill: Fill}
}

export interface Band extends Band.Attrs {}

export class Band extends Annotation {
  properties: Band.Props
  __view_type__: BandView

  constructor(attrs?: Partial<Band.Attrs>) {
    super(attrs)
  }

  static init_Band(): void {
    this.prototype.default_view = BandView

    this.mixins<Band.Mixins>([mixins.Line/*Scalar*/, mixins.Fill/*Scalar*/])

    this.define<Band.Props>({
      lower:        [ p.DistanceSpec                               ],
      upper:        [ p.DistanceSpec                               ],
      base:         [ p.DistanceSpec                               ],
      dimension:    [ p.Dimension,    'height'                     ],
      source:       [ p.Instance,     () => new ColumnDataSource() ],
      x_range_name: [ p.String,       'default'                    ],
      y_range_name: [ p.String,       'default'                    ],
    })

    this.override({
      fill_color: "#fff9ba",
      fill_alpha: 0.4,
      line_color: "#cccccc",
      line_alpha: 0.3,
    })
  }
}
