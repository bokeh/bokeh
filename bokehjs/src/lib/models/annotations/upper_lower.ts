import {DataAnnotation, DataAnnotationView} from "./data_annotation"
import {Scale} from "../scales/scale"
import {Arrayable} from "core/types"
import {Dimension, CoordinateUnits} from "core/enums"
import {Dimensional} from "core/vectorization"
import * as p from "core/properties"

export abstract class UpperLowerView extends DataAnnotationView {
  override model: UpperLower
  override visuals: UpperLower.Visuals

  protected _lower: Arrayable<number>
  protected _upper: Arrayable<number>
  protected _base:  Arrayable<number>

  protected _lower_sx: Arrayable<number>
  protected _lower_sy: Arrayable<number>
  protected _upper_sx: Arrayable<number>
  protected _upper_sy: Arrayable<number>

  get lower_coordinates(): {x_scale: Scale, y_scale: Scale} {
    switch (this.model.properties.lower.units) {
      case "canvas": return this.canvas.screen
      case "screen": return this.parent.view
      case "data":   return this.coordinates
    }
  }

  get upper_coordinates(): {x_scale: Scale, y_scale: Scale} {
    switch (this.model.properties.upper.units) {
      case "canvas": return this.canvas.screen
      case "screen": return this.parent.view
      case "data":   return this.coordinates
    }
  }

  get base_coordinates(): {x_scale: Scale, y_scale: Scale} {
    switch (this.model.properties.base.units) {
      case "canvas": return this.canvas.screen
      case "screen": return this.parent.view
      case "data":   return this.coordinates
    }
  }

  map_data(): void {
    const dim = this.model.dimension

    const lower_scale = dim == "height" ? this.lower_coordinates.y_scale : this.lower_coordinates.x_scale
    const upper_scale = dim == "height" ? this.upper_coordinates.y_scale : this.upper_coordinates.x_scale
    const base_scale  = dim == "height" ? this.base_coordinates.x_scale : this.base_coordinates.y_scale

    const _lower_sx = lower_scale.v_compute(this._lower)
    const _upper_sx = upper_scale.v_compute(this._upper)
    const _base_sx = base_scale.v_compute(this._base)

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
  override readonly obj: UpperLower

  protected override _value: Dimensional<this["__vector__"], CoordinateUnits> | p.Unset = p.unset

  get dimension(): "x" | "y" {
    return this.obj.dimension == "width" ? "x" : "y"
  }

  // XXX: a hack to make a coordinate & unit spec
  get units(): CoordinateUnits {
    return this._value === p.unset ? "data" : this._value.units ?? "data"
  }
}

export namespace UpperLower {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataAnnotation.Props & {
    dimension: p.Property<Dimension>
    lower: XOrYCoordinateSpec
    upper: XOrYCoordinateSpec
    base: XOrYCoordinateSpec
  }

  export type Visuals = DataAnnotation.Visuals
}

export interface UpperLower extends UpperLower.Attrs {}

export class UpperLower extends DataAnnotation {
  override properties: UpperLower.Props

  constructor(attrs?: Partial<UpperLower.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UpperLower.Props>(() => ({
      dimension: [ Dimension, "height" ],
      lower:     [ XOrYCoordinateSpec, {field: "lower"} ],
      upper:     [ XOrYCoordinateSpec, {field: "upper"} ],
      base:      [ XOrYCoordinateSpec, {field: "base"} ],
    }))
  }
}
