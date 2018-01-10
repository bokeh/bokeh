/* XXX: partial */
import {empty, label, select, option, optgroup} from "core/dom"
import {isString, isArray} from "core/util/types"
import {logger} from "core/logging"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

export class SelectView extends InputWidgetView {
  model: Select

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  build_options(values): HTMLElement[] {
    return values.map((el) => {
      if (isString(el))
        value = _label  = el
      else
        [value, _label] = el

      const selected = this.model.value == value
      return option({selected: selected, value: value}, _label)
    })
  }

  render(): void {
    super.render()
    empty(this.el)

    const labelEl = label({for: this.model.id}, this.model.title)
    this.el.appendChild(labelEl)

    let contents: HTMLElement[]
    if (isArray(this.model.options))
      contents = this.build_options(this.model.options)
    else {
      contents = []
      const options = this.model.options
      for (const key in options) {
        const value = options[key]
        contents.push(optgroup({label: key}, this.build_options(value)))
      }
    }

    this.selectEl = select({
      class: "bk-widget-form-input",
      id: this.model.id,
      name: this.model.name,
      disabled: this.model.disabled}, contents)

    this.selectEl.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.selectEl)
  }

  change_input(): void {
    const value = this.selectEl.value
    logger.debug(`selectbox: value = ${value}`)
    this.model.value = value
    super.change_input()
  }
}

export class Select extends InputWidget {
}

Select.prototype.type = "Select"
Select.prototype.default_view = SelectView

Select.define({
  value:   [ p.String, '' ],
  options: [ p.Any,    [] ], // TODO (bev) is this used?
})
