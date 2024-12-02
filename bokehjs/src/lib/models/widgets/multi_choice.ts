import Choices from "choices.js"

import type {StyleSheetLike} from "core/dom"
import {select} from "core/dom"
import {isString} from "core/util/types"
import {is_equal} from "core/util/eq"
import type * as p from "core/properties"

import * as inputs from "styles/widgets/inputs.css"
import choices_css from "styles/widgets/choices.css"

import {InputWidget, InputWidgetView} from "./input_widget"

function retarget<T extends Event>(event: T): T {
  Object.defineProperty(event, "target", {
    get: () => event.composedPath()[0] ?? null,
    configurable: true,
  })
  return event
}

class OurChoices extends Choices {
  override _onFocus(event: FocusEvent): void {
    super._onFocus(retarget(event))
  }
  override _onBlur(event: FocusEvent): void {
    super._onBlur(retarget(event))
  }
  override _onKeyUp(event: KeyboardEvent): void {
    super._onKeyUp(retarget(event))
  }
  override _onKeyDown(event: KeyboardEvent): void {
    super._onKeyDown(retarget(event))
  }
  override _onClick(event: MouseEvent): void {
    super._onClick(retarget(event))
  }
  override _onTouchEnd(event: TouchEvent): void {
    super._onTouchEnd(retarget(event))
  }
  override _onMouseDown(event: MouseEvent): void {
    super._onMouseDown(retarget(event))
  }
  override _onMouseOver(event: MouseEvent): void {
    super._onMouseOver(retarget(event))
  }
}

export class MultiChoiceView extends InputWidgetView {
  declare model: MultiChoice

  declare input_el: HTMLSelectElement
  choice_el: Choices

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.disabled.change, () => this.set_disabled())

    const {value, max_items, option_limit, search_option_limit, delete_button, placeholder, options, name, title} = this.model.properties
    this.on_change([max_items, option_limit, search_option_limit, delete_button, placeholder, options, name, title], () => this.rerender())
    this.on_change(value, () => {
      // Detects if value change originated in UI or elsewhere. Choices.js automatically
      // updates itself, so we don't have to do anything, and in fact we shouldn't do
      // anything, because the component is finicky and hard to update without breaking
      // something, losing focus, etc.
      if (!is_equal(this.model.value, this._current_values)) {
        this.rerender()
      }
    })
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), choices_css]
  }

  protected _render_input(): HTMLElement {
    return this.input_el = select({
      multiple: true,
      class: inputs.input,
      name: this.model.name,
      disabled: this.model.disabled,
    })
  }

  override render(): void {
    super.render()

    const selected = new Set(this.model.value)
    const choices = this.model.options.map((opt) => {
      let value, label
      if (isString(opt)) {
        value = label  = opt
      } else {
        [value, label] = opt
      }
      return {value, label, selected: selected.has(value)}
    })

    const fill = this.model.solid ? "solid" : "light"
    const item = `choices__item ${fill}`
    const button = `choices__button ${fill}`

    const options: Partial<Choices["config"]> = {
      choices,
      itemSelectText: "",
      duplicateItemsAllowed: false,
      shouldSort: false,
      removeItemButton: this.model.delete_button,
      classNames: {item, button} as any, // XXX: missing typings
      placeholderValue: this.model.placeholder,
      maxItemCount: this.model.max_items ?? -1,
      renderChoiceLimit: this.model.option_limit ?? -1,
      searchResultLimit: this.model.search_option_limit ?? 4,
    }

    this.choice_el = new OurChoices(this.input_el, options)
    this.input_el.addEventListener("change", () => this.change_input())
  }

  set_disabled(): void {
    if (this.model.disabled) {
      this.choice_el.disable()
    } else {
      this.choice_el.enable()
    }
  }

  protected get _current_values(): string[] {
    const values = this.choice_el.getValue() as {value: string}[]
    return values.map((item) => item.value)
  }

  override change_input(): void {
    this.model.value = this._current_values
    super.change_input()
  }
}

export namespace MultiChoice {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string[]>
    options: p.Property<(string | [string, string])[]>
    max_items: p.Property<number| null>
    delete_button: p.Property<boolean>
    placeholder: p.Property<string | null>
    option_limit: p.Property<number | null>
    search_option_limit: p.Property<number | null>
    solid: p.Property<boolean>
  }
}

export interface MultiChoice extends MultiChoice.Attrs {}

export class MultiChoice extends InputWidget {
  declare properties: MultiChoice.Props
  declare __view_type__: MultiChoiceView

  constructor(attrs?: Partial<MultiChoice.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultiChoiceView

    this.define<MultiChoice.Props>(({Bool, Int, Str, List, Tuple, Or, Nullable}) => ({
      value:               [ List(Str), [] ],
      options:             [ List(Or(Str, Tuple(Str, Str))), [] ],
      max_items:           [ Nullable(Int), null ],
      delete_button:       [ Bool, true ],
      placeholder:         [ Nullable(Str), null ],
      option_limit:        [ Nullable(Int), null ],
      search_option_limit: [ Nullable(Int), null ],
      solid:               [ Bool, true ],
    }))
  }
}
