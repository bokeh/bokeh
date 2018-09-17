import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {CallbackLike} from "../callbacks/callback"

import {div} from "core/dom"
import {clear_menus} from "core/menus"
import * as p from "core/properties"

export class DropdownView extends AbstractButtonView {
  model: Dropdown

  protected _open: boolean = false

  connect_signals(): void {
    super.connect_signals()
    clear_menus.connect(() => this._clear_menu())
  }

  render(): void {
    super.render()

    if (!this.is_split_button) {
      this.el.classList.add("bk-bs-dropdown")
      this.buttonEl.classList.add("bk-bs-dropdown-toggle")
      this.buttonEl.appendChild(div({class: "bk-bs-caret"}))
    } else {
      this.el.classList.add("bk-bs-btn-group")
      const caret = this._render_button(div({class: "bk-bs-caret"}))
      caret.classList.add("bk-bs-dropdown-toggle")
      caret.addEventListener("click", () => this._toggle_menu())
      this.el.appendChild(caret)
    }

    const items = this.model.menu.map((item, i) => {
      if (item == null)
        return div({class: "bk-divider"})
      else {
        const [label,] = item
        const el = div({}, label)
        el.addEventListener("click", () => this._item_click(i))
        return el
      }
    })

    const menu = div({class: "bk-menu"}, items)
    this.el.appendChild(menu)
  }

  protected _clear_menu(): void {
    this._open = false
  }

  protected _toggle_menu(): void {
    const open = this._open
    clear_menus.emit()
    if (!open)
      this._open = true
  }

  protected _button_click(): void {
    if (!this.is_split_button)
      this._toggle_menu()
    else {
      this._clear_menu()
      //this.set_value(this.model.default_value)
    }
  }

  protected _item_click(_i: number): void {
    this._clear_menu()
    //this.set_value((event.currentTarget as HTMLElement).dataset.value!)
  }

  get is_split_button(): boolean {
    return this.model.default_value != null
  }
}

export namespace Dropdown {
  export interface Attrs extends AbstractButton.Attrs {
    default_value: string | null
    menu: ([string, string | CallbackLike<Dropdown>] | null)[]
  }

  export interface Props extends AbstractButton.Props {
    default_value: p.Property<string | null>
    menu: p.Property<([string, string | CallbackLike<Dropdown>] | null)[]>
  }
}

export interface Dropdown extends Dropdown.Attrs {}

export class Dropdown extends AbstractButton {
  properties: Dropdown.Props

  constructor(attrs?: Partial<Dropdown.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Dropdown"
    this.prototype.default_view = DropdownView

    this.define({
      default_value: [ p.String    ],
      menu:          [ p.Array, [] ],
    })

    this.override({
      label: "Dropdown",
    })
  }
}
Dropdown.initClass()
