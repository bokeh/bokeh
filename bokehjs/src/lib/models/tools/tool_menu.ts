import {Menu, MenuView} from "../ui/menus/menu"
import type {MenuItemLike} from "../ui/menus/menu"
import {Toolbar} from "./toolbar"
import type * as p from "core/properties"

export class ToolMenuView extends MenuView {
  declare model: ToolMenu

  protected override _compute_menu_items(): MenuItemLike[] {
    const {items} = this.model.toolbar.to_menu()
    return items
  }

  override connect_signals(): void {
    super.connect_signals()

    const {toolbar} = this.model.properties
    this.on_transitive_change(toolbar, () => this._update_menu_items())
  }
}

export namespace ToolMenu {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Menu.Props & {
    toolbar: p.Property<Toolbar>
  }
}

export interface ToolMenu extends ToolMenu.Attrs {}

export class ToolMenu extends Menu {
  declare properties: ToolMenu.Props
  declare __view_type__: ToolMenuView

  constructor(attrs?: Partial<ToolMenu.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolMenuView

    this.define<ToolMenu.Props>(({Ref}) => ({
      toolbar: [ Ref(Toolbar) ],
    }))
  }
}
