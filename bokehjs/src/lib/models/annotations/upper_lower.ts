import {Annotation, AnnotationView} from "./annotation"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ColumnDataSource} from "../sources/column_data_source"
import type {CoordinateUnits} from "core/enums"
import {Dimension} from "core/enums"
import type {Dimensional} from "core/vectorization"
import * as p from "core/properties"

export abstract class UpperLowerView extends AnnotationView {
  declare model: UpperLower
  declare visuals: UpperLower.Visuals
}

export class XOrYCoordinateSpec extends p.CoordinateSpec {
  declare readonly obj: UpperLower

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

  export type Props = Annotation.Props & {
    source: p.Property<ColumnarDataSource>
    dimension: p.Property<Dimension>
    lower: XOrYCoordinateSpec
    upper: XOrYCoordinateSpec
    base: XOrYCoordinateSpec
  }

  export type Visuals = Annotation.Visuals
}

export interface UpperLower extends UpperLower.Attrs {}

export class UpperLower extends Annotation {
  declare properties: UpperLower.Props

  constructor(attrs?: Partial<UpperLower.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UpperLower.Props>(({Ref}) => ({
      source:    [ Ref(ColumnarDataSource), () => new ColumnDataSource() ],
      dimension: [ Dimension, "height" ],
      lower:     [ XOrYCoordinateSpec, {field: "lower"} ],
      upper:     [ XOrYCoordinateSpec, {field: "upper"} ],
      base:      [ XOrYCoordinateSpec, {field: "base"} ],
    }))
  }
}
