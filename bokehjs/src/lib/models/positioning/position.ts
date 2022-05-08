import {Model} from "../../model"
import * as p from "core/properties"

export namespace Position {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface Position extends Position.Attrs {}

export abstract class Position extends Model {
  override properties: Position.Props

  constructor(attrs?: Partial<Position.Attrs>) {
    super(attrs)
  }
}
