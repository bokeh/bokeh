import {MenuItem} from "./menu_item"
import type * as p from "core/properties"

export namespace MenuDivider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

export interface MenuDivider extends MenuDivider.Attrs {}

export class MenuDivider extends MenuItem {
  declare properties: MenuDivider.Props

  constructor(attrs?: Partial<MenuDivider.Attrs>) {
    super(attrs)
  }
}
