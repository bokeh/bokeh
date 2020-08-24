import {Annotation, AnnotationView} from "./annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import {Arrayable} from "core/types"
import {Dimension} from "core/enums"
import * as p from "core/properties"

export abstract class UpperLowerView extends AnnotationView {
  model: UpperLower
  visuals: UpperLower.Visuals

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

  set_data(source: ColumnarDataSource): void {
    super.set_data(source)
    this.visuals.warm_cache(source)
    this.plot_view.request_render()
  }

  protected _map_data(): void {
    const {frame} = this.plot_view
    const dim = this.model.dimension

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

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
}

export namespace UpperLower {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    lower: p.DistanceSpec
    upper: p.DistanceSpec
    base: p.DistanceSpec
    dimension: p.Property<Dimension>
    source: p.Property<ColumnarDataSource>
  }

  export type Visuals = Annotation.Visuals
}

export interface UpperLower extends UpperLower.Attrs {}

export class UpperLower extends Annotation {
  properties: UpperLower.Props

  constructor(attrs?: Partial<UpperLower.Attrs>) {
    super(attrs)
  }

  static init_UpperLower(): void {
    this.define<UpperLower.Props>({
      lower:        [ p.DistanceSpec                               ],
      upper:        [ p.DistanceSpec                               ],
      base:         [ p.DistanceSpec                               ],
      dimension:    [ p.Dimension,    'height'                     ],
      source:       [ p.Instance,     () => new ColumnDataSource() ],
    })
  }
}
