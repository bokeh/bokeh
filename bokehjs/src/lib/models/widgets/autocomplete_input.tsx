import {TextInput, TextInputView} from "./text_input"
import type {VNode} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import type {StyleSheetLike} from "core/stylesheets"
import type * as p from "core/properties"
import {bind} from "core/class"
import {take} from "core/util/iterator"
import {clamp} from "core/util/math"
import {Enum} from "core/kinds"
import * as inputs_css from "styles/widgets/inputs.css"
import * as dropdown_css from "styles/dropdown.css"
import * as menu_css from "styles/widgets/autocomplete_menu.css"
import {DropPane} from "core/util/panes"
import {InlineStyleSheet} from "core/dom"

import type {TargetedEvent, TargetedKeyboardEvent} from "preact"
import {createRef} from "preact"
import {signal} from "@preact/signals"

const SearchStrategy = Enum("starts_with", "includes")
type SearchStrategy = typeof SearchStrategy["__type__"]

const menu_stylesheets = [new InlineStyleSheet(menu_css.default)]

export class AutocompleteInputView extends TextInputView {
  declare readonly model: AutocompleteInput
  declare readonly signals: p.SignalsOf<AutocompleteInput.Props>
  declare readonly values: AutocompleteInput.Attrs

  protected readonly input_ref = createRef<HTMLInputElement>()

  protected readonly _open = signal<boolean>(false)
  protected readonly _completions = signal<string[]>([])
  protected readonly _hover_index = signal<number>(0)

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), dropdown_css.default]
  }

  override component(): VNode {
    const {disabled, value, placeholder} = this.signals
    const {max_length, prefix, suffix} = this.values
    const Title = this._title_el
    const Menu = this._menu
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div class={inputs_css.outer}>
          {prefix != null ? <div class={inputs_css.prefix}>{prefix}</div> : null}
          <div class={inputs_css.inner}>
            <input
              ref={this.input_ref}
              type="text"
              id={this.input_id}
              class={inputs_css.input}
              disabled={disabled}
              value={value}
              placeholder={placeholder}
              maxLength={max_length ?? undefined}
              onKeyUp={this._key_up}
              onFocusIn={this._focus_in}
              onChange={this._change}
              onInput={(event) => this.model.value_input = event.currentTarget.value}
            />
          </div>
          {suffix != null ? <div class={inputs_css.suffix}>{suffix}</div> : null}
        </div>
        <Menu/>
      </UIComponent>
    )
  }

  /**
   * The menu is a separate component, so that updating it doesn't re-render the
   * input, which would reset input's value to the last committed value.
   */
  @bind
  protected _menu(): VNode {
    const completions = this._completions.value
    const hover_index = this._hover_index.value
    return (
      <DropPane
        open={this._open.value}
        on_dismiss={this._hide_menu}
        ignore={this.el}
        class={cls(dropdown_css.menu, dropdown_css.below)}
        stylesheets={menu_stylesheets}
      >
        {completions.map((text, i) => (
          <div
            class={cls(menu_css.item, i == hover_index ? menu_css.active : null)}
            onClick={() => this._select(text)}
            onMouseOver={() => this._bump_hover(i)}
          >{text}</div>
        ))}
      </DropPane>
    )
  }

  @bind
  protected _focus_in(_event: TargetedEvent<HTMLInputElement>): void {
    this._toggle_menu()
  }

  @bind
  protected _change(event: TargetedEvent<HTMLInputElement>): void {
    this._commit(event.currentTarget.value)
  }

  protected _commit(input_value: string): void {
    const completions = this._completions.value
    if (this._open.value && completions.length > 0) {
      this._select(completions[this._hover_index.value])
    } else if (!this.values.restrict) {
      this.model.value = input_value
    }
  }

  protected _select(text: string): void {
    this.model.value = text
    this.input_ref.current?.focus()
    this._hide_menu()
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
    const value = this.input_ref.current?.value ?? ""

    if (value.length < this.model.min_characters) {
      this._hide_menu()
      return
    }

    const {max_completions} = this.model
    const completions = this.compute_completions(value)
    const selected_completions = max_completions != null ? [...take(completions, max_completions)] : completions
    this._completions.value = selected_completions

    if (selected_completions.length == 0) {
      this._hide_menu()
    } else {
      this._show_menu()
    }
  }

  protected _show_menu(): void {
    if (!this._open.value) {
      this._open.value = true
      this._hover_index.value = 0
    }
  }

  @bind
  protected _hide_menu(): void {
    this._open.value = false
  }

  protected _bump_hover(new_index: number): void {
    const n_completions = this._completions.value.length
    if (this._open.value && n_completions > 0) {
      this._hover_index.value = clamp(new_index, 0, n_completions-1)
    }
  }

  @bind
  protected override _key_up(event: TargetedKeyboardEvent<HTMLInputElement>): void {
    super._key_up(event)

    switch (event.key) {
      case "Enter": {
        this._commit(event.currentTarget.value)
        break
      }
      case "Escape": {
        this._hide_menu()
        break
      }
      case "ArrowUp": {
        this._bump_hover(this._hover_index.value - 1)
        break
      }
      case "ArrowDown": {
        this._bump_hover(this._hover_index.value + 1)
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
