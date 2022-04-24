import {Model} from "../../model"
import * as p from "core/properties"

export namespace Coordinate {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Coordinate extends Coordinate.Attrs {}

export class Coordinate extends Model {
  override properties: Coordinate.Props

  constructor(attrs?: Partial<Coordinate.Attrs>) {
    super(attrs)
  }
}
