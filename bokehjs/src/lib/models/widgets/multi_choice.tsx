import type Choices from "choices.js"
import type {ChoicesInstance} from "../../external/choices"

import type {StyleSheetLike} from "core/dom"
import {select, empty} from "core/dom"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import {bind} from "core/class"
import {isString} from "core/util/types"
import {is_equal} from "core/util/eq"
import {assert} from "core/util/assert"
import type * as p from "core/properties"

import * as inputs_css from "styles/widgets/inputs.css"
import choices_css from "styles/widgets/choices.css"

import {InputWidget, InputWidgetView} from "./input_widget"

function retarget<T extends Event>(event: T): T {
  Object.defineProperty(event, "target", {
    get: () => event.composedPath()[0] ?? null,
    configurable: true,
  })
  return event
}

async function load_retargeting_choices_class(): Promise<typeof Choices> {
  // Choices.js accesses browser globals when evaluated, so load it only with the view.
  const {default: Choices} = await import("choices.js")
  return class RetargetingChoices extends Choices {
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
}

export class MultiChoiceView extends InputWidgetView {
  declare readonly model: MultiChoice
  declare readonly signals: p.SignalsOf<MultiChoice.Props>
  declare readonly values: MultiChoice.Attrs

  declare input_el: HTMLSelectElement
  protected _choices: ChoicesInstance | null = null
  protected _Choices: typeof Choices

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  ///

  /**
   * The element hosting Choices.js' component. Choices.js manages its own DOM,
   * so this element has no vDOM children.
   */
  protected _choices_host: HTMLElement | null = null

  get choice_el(): ChoicesInstance {
    assert(this._choices != null, "Choices.js component wasn't rendered")
    return this._choices
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this._Choices = await load_retargeting_choices_class()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.disabled.change, () => this.set_disabled())

    const {value, max_items, option_limit, search_option_limit, delete_button, placeholder, options, name, solid} = this.model.properties
    this.on_change([max_items, option_limit, search_option_limit, delete_button, placeholder, options, name, solid], () => this._build_choices())
    this.on_change(value, () => {
      // Detects if value change originated in UI or elsewhere. Choices.js automatically
      // updates itself, so we don't have to do anything, and in fact we shouldn't do
      // anything, because the component is finicky and hard to update without breaking
      // something, losing focus, etc.
      if (!is_equal(this.model.value, this._current_values)) {
        this._build_choices()
      }
    })
  }

  override remove(): void {
    this._destroy_choices()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), choices_css]
  }

  @bind
  protected _choices_ref(el: HTMLDivElement | null): void {
    if (el !== this._choices_host) {
      this._destroy_choices()
      this._choices_host = el
      this._build_choices()
    }
  }

  override component(): VNode {
    const Title = this._title_el
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div ref={this._choices_ref}/>
      </UIComponent>
    )
  }

  protected _destroy_choices(): void {
    this._choices?.destroy()
    this._choices = null
    const host = this._choices_host
    if (host != null) {
      empty(host)
    }
  }

  protected _build_choices(): void {
    const host = this._choices_host
    if (host == null) {
      return
    }

    this._destroy_choices()

    this.input_el = select({
      id: this.input_id,
      multiple: true,
      class: inputs_css.input,
      name: this.model.name,
      disabled: this.model.disabled,
    })
    host.append(this.input_el)

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

    this._choices = new this._Choices(this.input_el, options)
    this.input_el.addEventListener("change", () => this.change_input())
  }

  set_disabled(): void {
    if (this.model.disabled) {
      this._choices?.disable()
    } else {
      this._choices?.enable()
    }
  }

  protected get _current_values(): string[] {
    const values = (this._choices?.getValue() ?? []) as {value: string}[]
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
