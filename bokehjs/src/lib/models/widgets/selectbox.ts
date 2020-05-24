import {select, option, optgroup} from "core/dom"
import {isString, isArray} from "core/util/types"
import {entries} from "core/util/object"
import {logger} from "core/logging"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"
import {bk_input} from "styles/widgets/inputs"

export class SelectView extends InputWidgetView {
  model: Select

  protected select_el: HTMLSelectElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  build_options(values: (string | [string, string])[]): HTMLElement[] {
    return values.map((el) => {
      let value, _label
      if (isString(el))
        value = _label  = el
      else
        [value, _label] = el

      const selected = this.model.value == value
      return option({selected, value}, _label)
    })
  }

  render(): void {
    super.render()

    let contents: HTMLElement[]
    if (isArray(this.model.options))
      contents = this.build_options(this.model.options)
    else {
      contents = []
      const options = this.model.options
      for (const [key, value] of entries(options)) {
        contents.push(optgroup({label: key}, this.build_options(value)))
      }
    }

    this.select_el = select({
      class: bk_input,
      id: this.model.id,
      name: this.model.name,
      disabled: this.model.disabled}, contents)

    this.select_el.addEventListener("change", () => this.change_input())
    this.group_el.appendChild(this.select_el)
  }

  change_input(): void {
    const value = this.select_el.value
    logger.debug(`selectbox: value = ${value}`)
    this.model.value = value
    super.change_input()
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
