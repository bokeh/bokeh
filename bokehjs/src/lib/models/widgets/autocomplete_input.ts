import {TextInput, TextInputView} from "./text_input"

import {empty, ul, li, a, Keys} from "core/dom"
import {clear_menus} from "core/menus"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView {
  model: AutocompleteInput

  protected menuEl: HTMLElement

  connect_signals(): void {
    super.connect_signals()
    clear_menus.connect(() => this._clear_menu())
  }

  render(): void {
    super.render()

    this.inputEl.classList.add("bk-autocomplete-input")

    this.inputEl.addEventListener("keydown", (event) => this._keydown(event))
    this.inputEl.addEventListener("keyup", (event) => this._keyup(event))

    this.menuEl = ul({class: "bk-bs-dropdown-menu"})
    this.menuEl.addEventListener("click", (event) => this._item_click(event))
    this.el.appendChild(this.menuEl)
  }

  protected _render_items(completions: string[]): void {
    empty(this.menuEl)

    for (const text of completions) {
      const itemEl = li({}, a({data: {text: text}}, text))
      this.menuEl.appendChild(itemEl)
    }
  }

  protected _open_menu(): void {
    this.el.classList.add("bk-bs-open")
  }

  protected _clear_menu(): void {
    this.el.classList.remove("bk-bs-open")
  }

  protected _item_click(event: MouseEvent): void {
    event.preventDefault()

    if (event.target != event.currentTarget) {
      const el = event.target as HTMLElement
      const text = el.dataset.text!
      this.model.value = text
      //this.inputEl.value = text
    }
  }

  _keydown(_event: KeyboardEvent): void {}

  _keyup(event: KeyboardEvent): void {
    switch (event.keyCode) {
      case Keys.Enter: {
        console.log("enter")
        break
      }
      case Keys.Esc: {
        this._clear_menu()
        break
      }
      case Keys.Up:
      case Keys.Down: {
        console.log("up/down")
        break
      }
      default: {
        const value = this.inputEl.value

        if (value.length <= 1) {
          this._clear_menu()
          return
        }

        const completions: string[] = []
        for (const text of this.model.completions) {
          if (text.indexOf(value) != -1)
            completions.push(text)
        }

        if (completions.length == 0)
          this._clear_menu()
        else {
          this._render_items(completions)
          this._open_menu()
        }
      }
    }
  }
}

export namespace AutocompleteInput {
  export interface Attrs extends TextInput.Attrs {
    completions: string[]
  }

  export interface Props extends TextInput.Props {}
}

export interface AutocompleteInput extends AutocompleteInput.Attrs {}

export class AutocompleteInput extends TextInput {

  properties: AutocompleteInput.Props

  constructor(attrs?: Partial<AutocompleteInput.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "AutocompleteInput"
    this.prototype.default_view = AutocompleteInputView

    this.define({
      completions: [ p.Array, [] ],
    })

    this.internal({
      active: [p.Boolean, true],
    })
  }

  active: boolean
}

AutocompleteInput.initClass()
