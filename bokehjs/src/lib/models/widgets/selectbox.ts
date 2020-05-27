import {select, option, optgroup, empty, append} from "core/dom"
import {isString, isArray} from "core/util/types"
import {entries} from "core/util/object"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"
import {bk_input} from "styles/widgets/inputs"

export class SelectView extends InputWidgetView {
  model: Select

  protected input_el: HTMLSelectElement

  connect_signals(): void {
    super.connect_signals()
    const {value, options} = this.model.properties
    this.on_change(value, () => {
      this._update_value()
    })
    this.on_change(options, () => {
      empty(this.input_el)
      append(this.input_el, ...this.options_el())
    })
  }

  protected options_el(): HTMLOptionElement[] | HTMLOptGroupElement[]  {
    function build_options(values: (string | [string, string])[]): HTMLOptionElement[] {
      return values.map((el) => {
        let value, label
        if (isString(el))
          value = label  = el
        else
          [value, label] = el

        return option({value}, label)
      })
    }

    const {options} = this.model
    if (isArray(options))
      return build_options(options)
    else
      return entries(options).map(([label, values]) => optgroup({label}, build_options(values)))
  }

  render(): void {
    super.render()

    this.input_el = select({
      class: bk_input,
      name: this.model.name,
      disabled: this.model.disabled,
    }, this.options_el())

    this._update_value()

    this.input_el.addEventListener("change", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    const value = this.input_el.value
    this.model.value = value
    super.change_input()
  }

  protected _update_value(): void {
    const {value} = this.model
    if (value != null && value.length != 0) {
      this.input_el.value = this.model.value
    }
  }
}

export namespace Select {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    options: p.Property<(string | [string, string])[] | {[key: string]: (string | [string, string])[]}>
  }
}

export interface Select extends Select.Attrs {}

export class Select extends InputWidget {
  properties: Select.Props
  __view_type__: SelectView

  constructor(attrs?: Partial<Select.Attrs>) {
    super(attrs)
  }

  static init_Select(): void {
    this.prototype.default_view = SelectView

    this.define<Select.Props>({
      value:   [ p.String, '' ],
      options: [ p.Any,    [] ], // TODO (bev) is this used?
    })
  }
}
