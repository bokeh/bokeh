import {Coordinate} from "./coordinate"
import {CoordinateUnits} from "core/enums"
import * as p from "core/properties"

export namespace XY {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Coordinate.Props & {
    x: p.Property<number>
    y: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
  }
}

export interface XY extends XY.Attrs {}

export class XY extends Coordinate {
  override properties: XY.Props

  constructor(attrs?: Partial<XY.Attrs>) {
    super(attrs)
  }

  static {
    this.define<XY.Props>(({Number}) => ({
      x:       [ Number ],
      y:       [ Number ],
      x_units: [ CoordinateUnits, "data" ],
      y_units: [ CoordinateUnits, "data" ],
    }))
  }
}
