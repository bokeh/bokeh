import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {ButtonClick, MenuItemClick} from "core/bokeh_events"
import type {StyleSheetLike} from "core/dom"
import {div, display, undisplay, empty} from "core/dom"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import type {CallbackLike1} from "core/util/callbacks"
import {execute} from "core/util/callbacks"
import * as buttons from "styles/buttons.css"
import dropdown_css, * as dropdown from "styles/dropdown.css"
import chevrons_css, * as chevrons from "styles/chevron.css"
import icons_css from "styles/icons.css"

export class DropdownView extends AbstractButtonView {
  declare model: Dropdown

  protected _open: boolean = false
  protected menu_el: HTMLElement
  protected _active: number

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), dropdown_css, icons_css, chevrons_css]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {menu} = this.model.properties
    this.on_change(menu, () => this.rebuild_menu())
  }

  override render(): void {
    super.render()

    const chevron = div({class: [chevrons.chevron, chevrons.down]})

    if (!this.model.is_split) {
      this.button_el.append(chevron)
    } else {
      const toggle = this._render_button(chevron)
      toggle.classList.add(buttons.dropdown_toggle)
      toggle.addEventListener("click", () => this._toggle_menu())
      this.group_el.append(toggle)
    }

    this.menu_el = div({class: [dropdown.menu, dropdown.below]})
    this.shadow_el.append(this.menu_el)
    this.rebuild_menu()
    undisplay(this.menu_el)
  }

  protected _update_chevron(new_chevron: HTMLElement): void {
    if (!this.model.is_split) {
      const previous_chevron = this.button_el.lastElementChild
      if (previous_chevron !== null) {
        this.button_el.removeChild(previous_chevron)
      }
      this.button_el.append(new_chevron)
    } else {
      const previous_chevron = this.group_el.lastElementChild
      if (previous_chevron !== null) {
        this.group_el.removeChild(previous_chevron)
      }
      const toggle = this._render_button(new_chevron)
      toggle.classList.add(buttons.dropdown_toggle)
      toggle.addEventListener("click", () => this._toggle_menu())
      this.group_el.append(toggle)
    }
  }

  protected _show_menu(): void {
    if (!this._open) {
      this._open = true
      display(this.menu_el)
      const first_menu_item = this.menu_el.firstElementChild as HTMLElement
      first_menu_item.focus()

      const new_chevron = div({class: [chevrons.chevron, chevrons.up]})
      this._update_chevron(new_chevron)

      const listener = (event: MouseEvent) => {
        if (!event.composedPath().includes(this.el)) {
          document.removeEventListener("click", listener)
          this._hide_menu()
        }
      }
      document.addEventListener("click", listener)
    }
  }

  protected _hide_menu(): void {
    if (this._open) {
      this._open = false
      const new_chevron = div({class: [chevrons.chevron, chevrons.down]})
      this._update_chevron(new_chevron)
      undisplay(this.menu_el)
    }
  }

  protected _toggle_menu(): void {
    if (this._open) {
      this._hide_menu()
    } else {
      this._show_menu()
    }
  }

  override click(): void {
    if (!this.model.is_split) {
      this._toggle_menu()
    } else {
      this._hide_menu()
      this.model.trigger_event(new ButtonClick())
      super.click()
    }
  }

  protected _item_click(i: number): void {
    this._hide_menu()

    const item = this.model.menu[i]
    if (item != null) {
      const value_or_callback = isString(item) ? item : item[1]
      this._active = i
      if (isString(value_or_callback)) {
        this.model.trigger_event(new MenuItemClick(value_or_callback))
      } else {
        void execute(value_or_callback, this.model, {index: i})
      }
      this.rebuild_menu()
    }
  }

  rebuild_menu(): void {
    empty(this.menu_el)

    const items = this.model.menu.map((item, i) => {
      if (item == null) {
        return div({class: dropdown.divider})
      } else {
        const label = isString(item) ? item : item[0]
        let el = div({tabIndex: 0}, label)
        if (this._active === i) {
          el = div({class: [dropdown.active], tabIndex: 0}, label)
        }
        el.addEventListener("click", () => this._item_click(i))
        el.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault()
            this._item_click(i)
          }
        })
        return el
      }
    })
    this.menu_el.append(...items)
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
