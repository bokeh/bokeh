import {Coordinate} from "./coordinate"
import {XY} from "./xy"
import {AngleUnits, Direction} from "core/enums"
import type * as p from "core/properties"

export namespace Polar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Coordinate.Props & {
    origin: p.Property<Coordinate>
    radius: p.Property<number>
    angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
  }
}

export interface Polar extends Polar.Attrs {}

export class Polar extends Coordinate {
  declare properties: Polar.Props

  constructor(attrs?: Partial<Polar.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Polar.Props>(({Number, NonNegative, Ref}) => ({
      origin: [ Ref(Coordinate), new XY({x: 0, y: 0}) ],
      radius: [ NonNegative(Number), 0 ],
      angle: [ Number, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      direction: [ Direction, "anticlock" ],
    }))
  }
}
