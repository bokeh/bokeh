import {MenuItem} from "./menu_item"
import type * as p from "core/properties"

/** @deprecated use MenuItem.checkable */
export namespace CheckableItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

/** @deprecated use MenuItem.checkable */
export interface CheckableItem extends CheckableItem.Attrs {}

/** @deprecated use MenuItem.checkable */
export class CheckableItem extends MenuItem {
  declare properties: CheckableItem.Props

  constructor(attrs?: Partial<CheckableItem.Attrs>) {
    super(attrs)
  }
}
