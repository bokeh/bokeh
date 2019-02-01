import {TextInput, TextInputView} from "./text_input"

import {empty, show, hide, div, Keys} from "core/dom"
import * as p from "core/properties"

export class AutocompleteInputView extends TextInputView {
  model: AutocompleteInput

  protected _open: boolean = false

  protected menu: HTMLElement

  render(): void {
    super.render()

    this.input.classList.add("bk-autocomplete-input")

    this.input.addEventListener("keydown", (event) => this._keydown(event))
    this.input.addEventListener("keyup", (event) => this._keyup(event))

    this.menu = div({class: ["bk-menu", "bk-below"]})
    this.menu.addEventListener("click", (event) => this._menu_click(event))
    this.el.appendChild(this.menu)
    hide(this.menu)
  }

  protected _update_completions(completions: string[]): void {
    empty(this.menu)

    for (const text of completions) {
      const item = div({}, text)
      this.menu.appendChild(item)
    }
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

  protected _menu_click(event: MouseEvent): void {
    if (event.target != event.currentTarget && event.target instanceof Element) {
      this.input.value = event.target.textContent || ""
      this.input.focus()
      this._hide_menu()
    }
  }

  _keydown(_event: KeyboardEvent): void {}

  _keyup(event: KeyboardEvent): void {
    switch (event.keyCode) {
      case Keys.Enter: {
        // TODO
        break
      }
      case Keys.Esc: {
        this._hide_menu()
        break
      }
      case Keys.Up:
      case Keys.Down: {
        // TODO
        break
      }
      default: {
        const value = this.input.value

        if (value.length <= 1) {
          this._hide_menu()
          return
        }

        const completions: string[] = []
        for (const text of this.model.completions) {
          if (text.indexOf(value) != -1)
            completions.push(text)
        }

        this._update_completions(completions)

        if (completions.length == 0)
          this._hide_menu()
        else
          this._show_menu()
      }
    }
  }
}

export namespace AutocompleteInput {
  export interface Attrs extends TextInput.Attrs {
    completions: string[]
  }

  export interface Props extends TextInput.Props {
    completions: p.Property<string[]>
  }
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
  }
}
AutocompleteInput.initClass()
