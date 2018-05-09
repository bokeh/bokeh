import {span, ul, li, a} from "core/dom"
import {clear_menus} from "core/menus"
import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class DropdownView extends AbstractButtonView {
  model: Dropdown

  connect_signals(): void {
    super.connect_signals()
    clear_menus.connect(() => this._clear_menu())
  }

  render(): void {
    super.render()

    if (!this.model.is_split_button) {
      this.el.classList.add("bk-bs-dropdown")
      this.buttonEl.classList.add("bk-bs-dropdown-toggle")
      this.buttonEl.appendChild(span({class: "bk-bs-caret"}))
    } else {
      this.el.classList.add("bk-bs-btn-group")
      const caretEl = this._render_button(span({class: "bk-bs-caret"}))
      caretEl.classList.add("bk-bs-dropdown-toggle")
      caretEl.addEventListener("click", (event) => this._caret_click(event))
      this.el.appendChild(caretEl)
    }

    if (this.model.active)
      this.el.classList.add("bk-bs-open")

    const items = []
    for (const item of this.model.menu) {
      let itemEl: HTMLElement
      if (item != null) {
        const [label, value] = item
        const link = a({}, label)
        link.dataset.value = value
        link.addEventListener("click", (event) => this._item_click(event))
        itemEl = li({}, link)
      } else
        itemEl = li({class: "bk-bs-divider"})
      items.push(itemEl)
    }

    const menuEl = ul({class: "bk-bs-dropdown-menu"}, items)
    this.el.appendChild(menuEl)
  }

  protected _clear_menu(): void {
    this.model.active = false
  }

  protected _toggle_menu(): void {
    const active = this.model.active
    clear_menus.emit()
    if (!active)
      this.model.active = true
  }

  protected _button_click(event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()

    if (!this.model.is_split_button)
      this._toggle_menu()
    else {
      this._clear_menu()
      this.set_value(this.model.default_value)
    }
  }

  protected _caret_click(event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this._toggle_menu()
  }

  protected _item_click(event: MouseEvent): void {
    event.preventDefault()
    this._clear_menu()
    this.set_value((event.currentTarget as HTMLElement).dataset.value!)
  }

  set_value(value: string): void {
    this.buttonEl.value = this.model.value = value
    this.change_input()
  }
}

export namespace Dropdown {
  export interface Attrs extends AbstractButton.Attrs {
    value: string
    default_value: string
    menu: ([string, string] | null)[]
  }

  export interface Props extends AbstractButton.Props {}
}

export interface Dropdown extends Dropdown.Attrs {
  active: boolean
}

export class Dropdown extends AbstractButton {

  properties: Dropdown.Props

  constructor(attrs?: Partial<Dropdown.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Dropdown"
    this.prototype.default_view = DropdownView

    this.define({
      value:         [ p.String    ],
      default_value: [ p.String    ],
      menu:          [ p.Array, [] ],
    })

    this.override({
      label: "Dropdown",
    })

    this.internal({
      active: [p.Boolean, false],
    })
  }

  get is_split_button(): boolean {
    return this.default_value != null
  }
}

Dropdown.initClass()
