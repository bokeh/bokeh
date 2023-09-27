import {Model} from "../../model"
import type * as p from "core/properties"

export namespace Coordinate {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Coordinate extends Coordinate.Attrs {}

export abstract class Coordinate extends Model {
  declare properties: Coordinate.Props

  constructor(attrs?: Partial<Coordinate.Attrs>) {
    super(attrs)
  }
}
