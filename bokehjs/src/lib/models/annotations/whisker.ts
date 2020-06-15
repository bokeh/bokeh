import {Annotation, AnnotationView} from "./annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {ArrowHead, TeeHead} from "./arrow_head"
import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Arrayable} from "core/types"
import {Dimension} from "core/enums"
import * as p from "core/properties"

export class WhiskerView extends AnnotationView {
  model: Whisker
  visuals: Whisker.Visuals

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

    const xscale = frame.xscales[this.model.x_range_name]
    const yscale = frame.yscales[this.model.y_range_name]

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

    if (this.visuals.line.doit) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(this._lower_sx[i], this._lower_sy[i])
        ctx.lineTo(this._upper_sx[i], this._upper_sy[i])
        ctx.stroke()
      }
    }

    const angle = this.model.dimension == "height" ? 0 : Math.PI / 2

    if (this.model.lower_head != null) {
      for (let i = 0, end = this._lower_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._lower_sx[i], this._lower_sy[i])
        ctx.rotate(angle + Math.PI)
        this.model.lower_head.render(ctx, i)
        ctx.restore()
      }
    }

    if (this.model.upper_head != null) {
      for (let i = 0, end = this._upper_sx.length; i < end; i++) {
        ctx.save()
        ctx.translate(this._upper_sx[i], this._upper_sy[i])
        ctx.rotate(angle)
        this.model.upper_head.render(ctx, i)
        ctx.restore()
      }
    }
  }
}

export namespace Whisker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    lower: p.DistanceSpec
    lower_head: p.Property<ArrowHead>
    upper: p.DistanceSpec
    upper_head: p.Property<ArrowHead>
    base: p.DistanceSpec
    dimension: p.Property<Dimension>
    source: p.Property<ColumnarDataSource>
    x_range_name: p.Property<string>
    y_range_name: p.Property<string>
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Annotation.Visuals & {line: Line}
}

export interface Whisker extends Whisker.Attrs {}

export class Whisker extends Annotation {
  properties: Whisker.Props
  __view_type__: WhiskerView

  constructor(attrs?: Partial<Whisker.Attrs>) {
    super(attrs)
  }

  static init_Whisker(): void {
    this.prototype.default_view = WhiskerView

    this.mixins<Whisker.Mixins>(LineVector)

    this.define<Whisker.Props>({
      lower:        [ p.DistanceSpec                    ],
      lower_head:   [ p.Instance,     () => new TeeHead({level: "underlay", size: 10}) ],
      upper:        [ p.DistanceSpec                    ],
      upper_head:   [ p.Instance,     () => new TeeHead({level: "underlay", size: 10}) ],
      base:         [ p.DistanceSpec                    ],
      dimension:    [ p.Dimension,    'height'          ],
      source:       [ p.Instance,     () => new ColumnDataSource()                     ],
      x_range_name: [ p.String,       'default'         ],
      y_range_name: [ p.String,       'default'         ],
    })

    this.override({
      level: 'underlay',
    })
  }
}
