import {select, option, optgroup, empty} from "core/dom"
import {isString, isArray} from "core/util/types"
import {entries} from "core/util/object"
import type * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"
import * as inputs from "styles/widgets/inputs.css"

import {Unknown, Str, List, Tuple, Or, Dict} from "core/kinds"

const Value = Unknown
type Value = typeof Value["__type__"]

const Label = Str
type Label = typeof Label["__type__"]

const Options = List(Or(Label, Tuple(Value, Label)))
type Options = typeof Options["__type__"]

const OptionsGroups = Dict(Options)
type OptionsGroups = typeof OptionsGroups["__type__"]

const NotSelected = ""

export class SelectView extends InputWidgetView {
  declare model: Select

  declare input_el: HTMLSelectElement

  override connect_signals(): void {
    super.connect_signals()
    const {value, options} = this.model.properties
    this.on_change(value, () => {
      this._update_value()
    })
    this.on_change(options, () => {
      empty(this.input_el)
      this.input_el.append(...this.options_el())
      this._update_value()
    })
  }

  private _known_values = new Map<Value, Label>()

  protected options_el(): HTMLOptionElement[] | HTMLOptGroupElement[] {
    const {_known_values} = this
    _known_values.clear()

    function build_options(values: Options): HTMLOptionElement[] {
      return values.map((el) => {
        let value, label
        if (isString(el)) {
          value = label = el
        } else {
          [value, label] = el
        }

        _known_values.set(value, label)
        return option({value: label}, label)
      })
    }

    const {options} = this.model
    if (isArray(options)) {
      return build_options(options)
    } else {
      return entries(options).map(([label, values]) => optgroup({label}, build_options(values)))
    }
  }

  protected _render_input(): HTMLElement {
    this.input_el = select({
      class: inputs.input,
      name: this.model.name,
      disabled: this.model.disabled,
    }, this.options_el())
    this.input_el.addEventListener("change", () => this.change_input())
    return this.input_el
  }

  override render(): void {
    super.render()
    this._update_value()
  }

  override change_input(): void {
    const selected_label = this.input_el.value
    const found = [...this._known_values].find(([_, label]) => selected_label == label)
    const value = (() => {
      if (found == null) {
        return NotSelected
      } else {
        const [value, _] = found
        return value
      }
    })()
    this.model.value = value
    super.change_input()
  }

  protected _update_value(): void {
    const {value} = this.model
    const label = this._known_values.get(value)
    if (label !== undefined) {
      this.input_el.value = label
    } else {
      this.input_el.removeAttribute("value")
      this.input_el.selectedIndex = -1
    }
  }
}

export namespace Select {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<Value>
    options: p.Property<Options | OptionsGroups>
  }
}

export interface Select extends Select.Attrs {}

export class Select extends InputWidget {
  declare properties: Select.Props
  declare __view_type__: SelectView

  constructor(attrs?: Partial<Select.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SelectView

    this.define<Select.Props>(() => {
      return {
        value:   [ Value, NotSelected ],
        options: [ Or(Options, OptionsGroups), [] ],
      }
    })
  }
}
