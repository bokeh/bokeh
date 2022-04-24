import {Coordinate} from "./coordinate"
import {AngleUnits} from "core/enums"
import * as p from "core/properties"

export namespace Polar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Coordinate.Props & {
    radius: p.Property<number>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
  }
}

export interface Polar extends Polar.Attrs {}

export class Polar extends Coordinate {
  override properties: Polar.Props

  constructor(attrs?: Partial<Polar.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Polar.Props>(({Number, NonNegative, Angle}) => ({
      radius:      [ NonNegative(Number) ],
      angle:       [ Angle ],
      angle_units: [ AngleUnits, "rad" ],
    }))
  }
}
