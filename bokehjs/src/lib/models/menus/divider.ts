import {MenuItem, MenuItemView} from "./menu_item"
import * as p from "core/properties"

import * as menus from "styles/menus.css"

export class DividerView extends MenuItemView {
  override model: Divider

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
  override properties: Divider.Props
  override __view_type__: DividerView

  constructor(attrs?: Partial<Divider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DividerView
  }
}
