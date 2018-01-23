/* XXX: partial */
import {TextInput, TextInputView} from "./text_input"
import {clear_menus} from "./common"

import {empty, ul, li, a, Keys} from "core/dom"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView {
  model: AutocompleteInput

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

  _render_items(completions): void {
    empty(this.menuEl)

    for (const text of completions) {
      const itemEl = li({}, a({data: {text: text}}, text))
      this.menuEl.appendChild(itemEl)
    }
  }

  _open_menu(): void {
    this.el.classList.add("bk-bs-open")
  }

  _clear_menu(): void {
    this.el.classList.remove("bk-bs-open")
  }

  _item_click(event): void {
    event.preventDefault()

    if (event.target != event.currentTarget) {
      const el = event.target
      const text = el.dataset.text
      this.model.value = text
      //this.inputEl.value = text
    }
  }

  _keydown(_event): void {}

  _keyup(event): void {
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

export class AutocompleteInput extends TextInput {

  static initClass() {
    this.prototype.type = "AutocompleteInput"
    this.prototype.default_view = AutocompleteInputView

    this.define({
      completions: [ p.Array, [] ],
    })

    this.internal({
      active: [p.Boolean, true],
    })
  }

  completions: string[]
  active: boolean
}

AutocompleteInput.initClass()
