import {MenuItem} from "./menu_item"
import type * as p from "core/properties"

export namespace DividerItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

export interface DividerItem extends DividerItem.Attrs {}

export class DividerItem extends MenuItem {
  declare properties: DividerItem.Props

  constructor(attrs?: Partial<DividerItem.Attrs>) {
    super(attrs)
  }
}
