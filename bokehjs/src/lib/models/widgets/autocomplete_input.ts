import {TextInput, TextInputView} from "./text_input"

import {empty, display, undisplay, div, Keys} from "core/dom"
import * as p from "core/properties"
import {clamp} from "core/util/math"

import menus_css, * as menus from "styles/menus.css"

export class AutocompleteInputView extends TextInputView {
  override model: AutocompleteInput

  protected _open: boolean = false

  protected _last_value: string = ""

  protected _hover_index: number = 0

  protected menu: HTMLElement

  override styles(): string[] {
    return [...super.styles(), menus_css]
  }

  override render(): void {
    super.render()

    this.input_el.addEventListener("keydown", (event) => this._keydown(event))
    this.input_el.addEventListener("keyup", (event) => this._keyup(event))

    this.menu = div({class: [menus.menu, menus.below]})
    this.menu.addEventListener("click", (event) => this._menu_click(event))
    this.menu.addEventListener("mouseover", (event) => this._menu_hover(event))
    this.shadow_el.appendChild(this.menu)
    undisplay(this.menu)
  }

  override change_input(): void {
    if (this._open && this.menu.children.length > 0) {
      this.model.value = this.menu.children[this._hover_index].textContent!
      this.input_el.focus()
      this._hide_menu()
    } else if (!this.model.restrict) {
      super.change_input()
    }
  }

  protected _update_completions(completions: string[]): void {
    empty(this.menu)

    for (const text of completions) {
      const item = div(text)
      this.menu.appendChild(item)
    }
    if (completions.length > 0)
      this.menu.children[0].classList.add(menus.active)
  }

  protected _show_menu(): void {
    if (!this._open) {
      this._open = true
      this._hover_index = 0
      this._last_value = this.model.value
      display(this.menu)

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
      undisplay(this.menu)
    }
  }

  protected _menu_click(event: MouseEvent): void {
    if (event.target != event.currentTarget && event.target instanceof Element) {
      this.model.value = event.target.textContent!
      this.input_el.focus()
      this._hide_menu()
    }
  }

  protected _menu_hover(event: MouseEvent): void {
    if (event.target != event.currentTarget && event.target instanceof Element) {
      let i = 0
      for (i = 0; i<this.menu.children.length; i++) {
        if (this.menu.children[i].textContent! == event.target.textContent!)
          break
      }
      this._bump_hover(i)
    }
  }

  protected _bump_hover(new_index: number): void {
    const n_children = this.menu.children.length
    if (this._open && n_children > 0) {
      this.menu.children[this._hover_index].classList.remove(menus.active)
      this._hover_index = clamp(new_index, 0, n_children-1)
      this.menu.children[this._hover_index].classList.add(menus.active)
    }
  }

  _keydown(_event: KeyboardEvent): void {}

  _keyup(event: KeyboardEvent): void {
    switch (event.keyCode) {
      case Keys.Enter: {
        this.change_input()
        break
      }
      case Keys.Esc: {
        this._hide_menu()
        break
      }
      case Keys.Up: {
        this._bump_hover(this._hover_index-1)
        break
      }
      case Keys.Down: {
        this._bump_hover(this._hover_index+1)
        break
      }
      default: {
        const value = this.input_el.value

        if (value.length < this.model.min_characters) {
          this._hide_menu()
          return
        }

        const completions: string[] = []
        const {case_sensitive} = this.model
        let acnorm: (t: string) => string
        if (case_sensitive) {
          acnorm = (t) => t
        } else {
          acnorm = (t) => t.toLowerCase()
        }

        for (const text of this.model.completions) {
          if (acnorm(text).startsWith(acnorm(value))) {
            completions.push(text)
          }
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
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextInput.Props & {
    completions: p.Property<string[]>
    min_characters: p.Property<number>
    case_sensitive: p.Property<boolean>
    restrict: p.Property<boolean>
  }
}

export interface AutocompleteInput extends AutocompleteInput.Attrs {}

export class AutocompleteInput extends TextInput {
  override properties: AutocompleteInput.Props
  override __view_type__: AutocompleteInputView

  constructor(attrs?: Partial<AutocompleteInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AutocompleteInputView

    this.define<AutocompleteInput.Props>(({Boolean, Int, String, Array}) => ({
      completions:    [ Array(String), [] ],
      min_characters: [ Int, 2 ],
      case_sensitive: [ Boolean, true ],
      restrict: [ Boolean, true ],
    }))
  }
}
