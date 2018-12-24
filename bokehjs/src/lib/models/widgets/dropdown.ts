import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {CallbackLike} from "../callbacks/callback"

import {ButtonClick, MenuItemClick} from "core/bokeh_events"
import {div, show, hide} from "core/dom"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class DropdownView extends AbstractButtonView {
  model: Dropdown

  protected _open: boolean = false

  protected menu: HTMLElement

  render(): void {
    super.render()

    if (!this.model.is_split) {
      this.buttonEl.classList.add("bk-dropdown-toggle")
      this.buttonEl.appendChild(div({class: "bk-caret"}))
    } else {
      const group = div({class: "bk-btn-group"})
      this.el.appendChild(group)

      const caret = this._render_button(div({class: "bk-caret"}))
      caret.classList.add("bk-dropdown-toggle")
      caret.addEventListener("click", () => this._toggle_menu())

      group.appendChild(this.buttonEl)
      group.appendChild(caret)
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

    this.menu = div({class: ["bk-menu", "bk-below"]}, items)
    this.el.appendChild(this.menu)
    hide(this.menu)
  }

  protected _show_menu(): void {
    if (!this._open) {
      this._open = true
      show(this.menu)

      const listener = (event: MouseEvent) => {
        const {target} = event
        if (target instanceof HTMLElement && !this.el.contains(target)) {
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
      hide(this.menu)
    }
  }

  protected _toggle_menu(): void {
    if (this._open)
      this._hide_menu()
    else
      this._show_menu()
  }

  click(): void {
    if (!this.model.is_split)
      this._toggle_menu()
    else {
      this._hide_menu()
      this.model.trigger_event(new ButtonClick())
      this.model.value = this.model.default_value
      super.click()
    }
  }

  protected _item_click(i: number): void {
    this._hide_menu()

    const item = this.model.menu[i]
    if (item != null) {
      const [, value_or_callback] = item
      if (isString(value_or_callback)) {
        this.model.trigger_event(new MenuItemClick({item: value_or_callback}))
        this.model.value = value_or_callback
      } else
        value_or_callback.execute(this.model, {index: i}) // TODO
    }
  }
}

export namespace Dropdown {
  export interface Attrs extends AbstractButton.Attrs {
    split: boolean
    menu: ([string, string | CallbackLike<Dropdown>] | null)[]
    value: string
    default_value: string
  }

  export interface Props extends AbstractButton.Props {
    split: p.Property<boolean>
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
      split:         [ p.Boolean, false ],
      menu:          [ p.Array,   []    ],
      value:         [ p.String,  null  ], // deprecated
      default_value: [ p.String,  null  ], // deprecated
    })

    this.override({
      label: "Dropdown",
    })

    this.register(ButtonClick, MenuItemClick)
  }

  get is_split(): boolean {
    return this.split || this.default_value != null
  }
}
Dropdown.initClass()
