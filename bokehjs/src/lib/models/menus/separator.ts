import {MenuItem, MenuItemView} from "./menu_item"
import * as p from "core/properties"

import * as menus from "styles/menus.css"

export class SeparatorView extends MenuItemView {
  override model: Separator

  override render(): void {
    super.render()
    this.el.classList.add(menus.divider)
  }
}

export namespace Separator {
  export type Attrs = p.AttrsOf<Props>
  export type Props = MenuItem.Props
}

export interface Separator extends Separator.Attrs {}

export class Separator extends MenuItem {
  override properties: Separator.Props
  override __view_type__: SeparatorView

  constructor(attrs?: Partial<Separator.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SeparatorView
  }
}
