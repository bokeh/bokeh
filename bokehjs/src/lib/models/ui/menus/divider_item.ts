import {Model} from "../../../model"
import type * as p from "core/properties"

export namespace DividerItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface DividerItem extends DividerItem.Attrs {}

export class DividerItem extends Model {
  declare properties: DividerItem.Props

  constructor(attrs?: Partial<DividerItem.Attrs>) {
    super(attrs)
  }
}
