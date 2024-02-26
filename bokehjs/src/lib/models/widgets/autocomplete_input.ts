import {TextInput, TextInputView} from "./text_input"

import type {StyleSheetLike} from "core/dom"
import {empty, display, undisplay, div} from "core/dom"
import type * as p from "core/properties"
import {take} from "core/util/iterator"
import {clamp} from "core/util/math"
import {Enum} from "core/kinds"

import dropdown_css, * as dropdown from "styles/dropdown.css"

const SearchStrategy = Enum("starts_with", "includes")
type SearchStrategy = typeof SearchStrategy["__type__"]

export class AutocompleteInputView extends TextInputView {
  declare model: AutocompleteInput

  protected _open: boolean = false

  protected _last_value: string = ""

  protected _hover_index: number = 0

  protected menu: HTMLElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), dropdown_css]
  }

  override render(): void {
    super.render()
    this.input_el.addEventListener("focusin", () => this._toggle_menu())

    this.menu = div({class: [dropdown.menu, dropdown.below]})
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

    const {max_completions} = this.model
    const selected_completions = max_completions != null ? take(completions, max_completions) : completions

    for (const text of selected_completions) {
      const item = div(text)
      this.menu.append(item)
    }

    this.menu.firstElementChild?.classList.add(dropdown.active)
  }

  compute_completions(value: string): string[] {
    const norm_function: (t: string) => string = (() => {
      const {case_sensitive} = this.model
      return case_sensitive ? (t) => t : (t) => t.toLowerCase()
    })()

    const search_function: (t: string, v: string) => boolean = (() => {
      switch (this.model.search_strategy) {
        case "starts_with": return (t, v) => t.startsWith(v)
        case "includes":    return (t, v) => t.includes(v)
      }
    })()

    const normalized_value = norm_function(value)

    const completions: string[] = []
    for (const text of this.model.completions) {
      const normalized_text = norm_function(text)
      if (search_function(normalized_text, normalized_value)) {
        completions.push(text)
      }
    }

    return completions
  }

  protected _toggle_menu(): void {
    const {value} = this.input_el

    if (value.length < this.model.min_characters) {
      this._hide_menu()
      return
    }

    const completions = this.compute_completions(value)
    this._update_completions(completions)

    if (completions.length == 0) {
      this._hide_menu()
    } else {
      this._show_menu()
    }
  }

  protected _show_menu(): void {
    if (!this._open) {
      this._open = true
      this._hover_index = 0
      this._last_value = this.model.value
      display(this.menu)

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
      for (let i = 0; i < this.menu.children.length; i++) {
        if (this.menu.children[i].textContent! == event.target.textContent!) {
          this._bump_hover(i)
          break
        }
      }
    }
  }

  protected _bump_hover(new_index: number): void {
    const n_children = this.menu.children.length
    if (this._open && n_children > 0) {
      this.menu.children[this._hover_index].classList.remove(dropdown.active)
      this._hover_index = clamp(new_index, 0, n_children-1)
      this.menu.children[this._hover_index].classList.add(dropdown.active)
    }
  }

  protected override _keyup(event: KeyboardEvent): void {
    super._keyup(event)

    switch (event.key) {
      case "Enter": {
        this.change_input()
        break
      }
      case "Escape": {
        this._hide_menu()
        break
      }
      case "ArrowUp": {
        this._bump_hover(this._hover_index - 1)
        break
      }
      case "ArrowDown": {
        this._bump_hover(this._hover_index + 1)
        break
      }
      default:
        this._toggle_menu()
    }
  }
}

export namespace AutocompleteInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextInput.Props & {
    completions: p.Property<string[]>
    min_characters: p.Property<number>
    max_completions: p.Property<number | null>
    case_sensitive: p.Property<boolean>
    restrict: p.Property<boolean>
    search_strategy: p.Property<SearchStrategy>
  }
}

export interface AutocompleteInput extends AutocompleteInput.Attrs {}

export class AutocompleteInput extends TextInput {
  declare properties: AutocompleteInput.Props
  declare __view_type__: AutocompleteInputView

  constructor(attrs?: Partial<AutocompleteInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AutocompleteInputView

    this.define<AutocompleteInput.Props>(({Bool, Int, Str, List, NonNegative, Positive, Nullable}) => ({
      completions:    [ List(Str), [] ],
      min_characters: [ NonNegative(Int), 2 ],
      max_completions: [ Nullable(Positive(Int)), null ],
      case_sensitive: [ Bool, true ],
      restrict: [ Bool, true ],
      search_strategy: [ SearchStrategy, "starts_with" ],
    }))
  }
}
