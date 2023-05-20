import {MenuItem, MenuItemView} from "./menu_item"
import type * as p from "core/properties"

import * as menus from "styles/menus.css"

export class DividerView extends MenuItemView {
  declare model: Divider

  override render(): void {
    super.render()
    this.el.classList.add(menus.divider)
  }
}

export namespace Divider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

export interface Divider extends Divider.Attrs {}

export class Divider extends MenuItem {
  declare properties: Divider.Props
  declare __view_type__: DividerView

  constructor(attrs?: Partial<Divider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DividerView
  }
}
