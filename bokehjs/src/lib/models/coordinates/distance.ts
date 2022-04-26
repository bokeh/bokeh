import {Model} from "../../model"
import {Coordinate} from "./coordinate"
import * as p from "core/properties"

export namespace Distance {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    p0: p.Property<Coordinate>
    p1: p.Property<Coordinate>
  }
}

export interface Distance extends Distance.Attrs {}

export class Distance extends Model {
  override properties: Distance.Props

  constructor(attrs?: Partial<Distance.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Distance.Props>(({Ref}) => ({
      p0: [ Ref(Coordinate) ],
      p1: [ Ref(Coordinate) ],
    }))
  }
}
