import {TextInput, TextInputView} from "./text_input"

import {empty, div, Keys} from "core/dom"
import {clear_menus} from "core/menus"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView {
  model: AutocompleteInput

  protected menu: HTMLElement

  connect_signals(): void {
    super.connect_signals()
    clear_menus.connect(() => this._clear_menu())
  }

  render(): void {
    super.render()

    this.input.classList.add("bk-autocomplete-input")

    this.input.addEventListener("keydown", (event) => this._keydown(event))
    this.input.addEventListener("keyup", (event) => this._keyup(event))

    this.menu = div({class: "bk-menu"})
    this.menu.addEventListener("click", (event) => this._menu_click(event))
    this.el.appendChild(this.menu)
  }

  protected _update_completions(completions: string[]): void {
    empty(this.menu)

    for (const text of completions) {
      const item = div({}, text)
      this.menu.appendChild(item)
    }
  }

  protected _open_menu(): void {
    this.el.classList.add("bk-open")
  }

  protected _clear_menu(): void {
    this.el.classList.remove("bk-open")
  }

  protected _menu_click(event: MouseEvent): void {
    if (event.target != event.currentTarget) {
      const el = event.target as HTMLElement
      const text = el.dataset.text!
      this.model.value = text
      //this.input.value = text
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
        const value = this.input.value

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
          this._update_completions(completions)
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
