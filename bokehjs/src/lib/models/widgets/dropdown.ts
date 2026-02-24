import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {ButtonClick, MenuItemClick} from "core/bokeh_events"
import type {StyleSheetLike} from "core/dom"
import {div} from "core/dom"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import type {CallbackLike1} from "core/util/callbacks"
import {execute} from "core/util/callbacks"
import * as buttons from "styles/buttons.css"
import dropdown_css from "styles/dropdown.css"
import carets_css, * as carets from "styles/caret.css"
import {DividerItem, Menu, MenuItem} from "../ui/menus"
import type {MenuView} from "../ui/menus/menu"
import {build_view} from "core/build_views"

export class DropdownView extends AbstractButtonView {
  declare model: Dropdown

  protected _open: boolean = false
  protected menu: MenuView

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), dropdown_css, carets_css]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    await this._build_menu()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {menu} = this.model.properties
    this.on_change(menu, async () => {
      const menu_open = this.menu.is_open
      await this._build_menu()
      this.rerender()
      if (menu_open) {
        this._toggle_menu()
      }
    })
  }

  override render(): void {
    super.render()

    const caret = div({class: [carets.caret, carets.down]})

    if (!this.model.is_split) {
      this.button_el.append(caret)
    } else {
      const toggle = this._render_button(caret)
      toggle.classList.add(buttons.dropdown_toggle)
      toggle.addEventListener("click", () => this._toggle_menu())
      this.group_el.append(toggle)
    }
  }

  protected async _build_menu(): Promise<void> {
    const menu_with_items = this.to_menu()
    this.menu = await build_view(menu_with_items, {parent: this})
  }

  protected _toggle_menu(): void {
    if (!this.menu.is_open) {
      this.menu.show({x: 0, y: this.button_el.offsetHeight})
    } else {
      this.menu.hide()
    }
  }

  override click(): void {
    if (!this.model.is_split) {
      this._toggle_menu()
    } else {
      this.menu.hide()
      this.model.trigger_event(new ButtonClick())
      super.click()
    }
  }

  protected _item_click(i: number): void {
    this.menu.hide()

    const item = this.model.menu[i]
    if (item != null) {
      const value_or_callback = isString(item) ? item : item[1]

      if (isString(value_or_callback)) {
        this.model.trigger_event(new MenuItemClick(value_or_callback))
      } else {
        void execute(value_or_callback, this.model, {index: i})
      }
    }
  }

  to_menu(): Menu {
    const items = this.model.menu.map((item, i) => {
      if (item == null) {
        return new DividerItem()
      } else {
        const label = isString(item) ? item : item[0]
        const menu_item = new MenuItem({
          label,
          action: () => { this._item_click(i) },
        })
        return menu_item
      }
    })
    return new Menu({items})
  }
}

export namespace Dropdown {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractButton.Props & {
    split: p.Property<boolean>
    menu: p.Property<(string | [string, string | CallbackLike1<Dropdown, {index: number}>] | null)[]>
  }
}

export interface Dropdown extends Dropdown.Attrs {}

export class Dropdown extends AbstractButton {
  declare properties: Dropdown.Props
  declare __view_type__: DropdownView

  constructor(attrs?: Partial<Dropdown.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DropdownView

    this.define<Dropdown.Props>(({Null, Bool, Str, List, Tuple, Or}) => ({
      split: [ Bool, false ],
      menu:  [ List(Or(Str, Tuple(Str, Or(Str /*TODO*/)), Null)), [] ],
    }))

    this.override<Dropdown.Props>({
      label: "Dropdown",
    })
  }

  get is_split(): boolean {
    return this.split
  }
}
