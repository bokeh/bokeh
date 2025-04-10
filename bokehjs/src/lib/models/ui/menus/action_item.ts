import {MenuItem} from "./menu_item"
import type * as p from "core/properties"

/** @deprecated use MenuItem */
export namespace ActionItem {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

/** @deprecated use MenuItem */
export interface ActionItem extends ActionItem.Attrs {}

/** @deprecated use MenuItem */
export class ActionItem extends MenuItem {
  declare properties: ActionItem.Props

  constructor(attrs?: Partial<ActionItem.Attrs>) {
    super(attrs)
  }
}
