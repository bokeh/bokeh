import {Model} from "../../../model"
import type * as p from "core/properties"

export namespace MenuItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface MenuItem extends MenuItem.Attrs {}

export abstract class MenuItem extends Model {
  declare properties: MenuItem.Props

  constructor(attrs?: Partial<MenuItem.Attrs>) {
    super(attrs)
  }
}
