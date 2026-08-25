import {DataAnnotation, DataAnnotationView} from "./data_annotation"
import type {Arrayable} from "core/types"
import {ScreenArray} from "core/types"
import {CoordinateUnits, Dimension} from "core/enums"
import * as p from "core/properties"

export abstract class UpperLowerView extends DataAnnotationView {
  declare model: UpperLower
  declare visuals: UpperLower.Visuals

  protected _lower: Arrayable<number>
  protected _upper: Arrayable<number>
  protected _base:  Arrayable<number>

  protected _lower_sx: Arrayable<number>
  protected _lower_sy: Arrayable<number>
  protected _upper_sx: Arrayable<number>
  protected _upper_sy: Arrayable<number>

  map_data(): void {
    const {frame} = this.plot_view
    const dim = this.model.dimension

    const xscale = this.coordinates.x_scale
    const yscale = this.coordinates.y_scale

    const limit_scale = dim == "height" ? yscale : xscale
    const base_scale  = dim == "height" ? xscale : yscale

    const limit_view = dim == "height" ? frame.bbox.yview : frame.bbox.xview
    const base_view  = dim == "height" ? frame.bbox.xview : frame.bbox.yview

    const _lower_sx = (() => {
      switch (this.model.properties.lower.units) {
        case "canvas":
          return new ScreenArray(this._lower)
        case "screen":
          return limit_view.v_compute(this._lower)
        case "data":
          return limit_scale.v_compute(this._lower)
      }
    })()

    const _upper_sx = (() => {
      switch (this.model.properties.upper.units) {
        case "canvas":
          return new ScreenArray(this._upper)
        case "screen":
          return limit_view.v_compute(this._upper)
        case "data":
          return limit_scale.v_compute(this._upper)
      }
    })()

    const _base_sx = (() => {
      switch (this.model.properties.base.units) {
        case "canvas":
          return new ScreenArray(this._base)
        case "screen":
          return base_view.v_compute(this._base)
        case "data":
          return base_scale.v_compute(this._base)
      }
    })()

    const [i, j] = dim == "height" ? [1, 0] : [0, 1]

    const _lower = [_lower_sx, _base_sx]
    const _upper = [_upper_sx, _base_sx]

    this._lower_sx = _lower[i]
    this._lower_sy = _lower[j]

    this._upper_sx = _upper[i]
    this._upper_sy = _upper[j]
  }
}

export class XOrYCoordinateSpec extends p.CoordinateSpec {
  declare readonly obj: UpperLower

  get dimension(): "x" | "y" {
    return this.obj.dimension == "width" ? "x" : "y"
  }

  override initialize(initial_value: Parameters<p.CoordinateSpec["initialize"]>[0] = p.unset): void {
    super.initialize(initial_value)
    p.units_property(this, CoordinateUnits, "data")
  }

  get units(): CoordinateUnits {
    return p.units_property(this, CoordinateUnits, "data").get_value()
  }
}

export namespace UpperLower {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataAnnotation.Props & {
    dimension: p.Property<Dimension>
    lower: XOrYCoordinateSpec
    lower_units: p.Property<CoordinateUnits>
    upper: XOrYCoordinateSpec
    upper_units: p.Property<CoordinateUnits>
    base: XOrYCoordinateSpec
    base_units: p.Property<CoordinateUnits>
  }

  export type Visuals = DataAnnotation.Visuals
}

export interface UpperLower extends UpperLower.Attrs {}

export class UpperLower extends DataAnnotation {
  declare properties: UpperLower.Props

  constructor(attrs?: Partial<UpperLower.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UpperLower.Props>(() => ({
      dimension: [ Dimension, "height" ],
      lower:     [ XOrYCoordinateSpec, {field: "lower"} ],
      lower_units: [ CoordinateUnits, "data" ],
      upper:     [ XOrYCoordinateSpec, {field: "upper"} ],
      upper_units: [ CoordinateUnits, "data" ],
      base:      [ XOrYCoordinateSpec, {field: "base"} ],
      base_units: [ CoordinateUnits, "data" ],
    }))
  }
}
