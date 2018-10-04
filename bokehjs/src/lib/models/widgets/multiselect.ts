import {empty, label, select, option} from "core/dom"
import {isString} from "core/util/types"
import {Set} from "core/util/data_structures"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

export class MultiSelectView extends InputWidgetView {
  model: MultiSelect

  protected selectEl: HTMLSelectElement

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.value.change, () => this.render_selection())
    this.connect(this.model.properties.options.change, () => this.render())
    this.connect(this.model.properties.name.change, () => this.render())
    this.connect(this.model.properties.title.change, () => this.render())
    this.connect(this.model.properties.size.change, () => this.render())
    this.connect(this.model.properties.disabled.change, () => this.render())
  }

  render(): void {
    super.render()
    empty(this.el)

    const labelEl = label({for: this.model.id}, this.model.title)
    this.el.appendChild(labelEl)

    const options = this.model.options.map((opt) => {
      let value, _label
      if (isString(opt))
        value = _label  = opt
      else
        [value, _label] = opt

      return option({value}, _label)
    })

    this.selectEl = select({
      multiple: true,
      class: "bk-widget-form-input",
      id: this.model.id,
      name: this.model.name,
      disabled: this.model.disabled,
    }, options)

    this.selectEl.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.selectEl)

    this.render_selection()
  }

  render_selection(): void {
    const selected = new Set(this.model.value)

    for (const el of Array.from(this.el.querySelectorAll('option')))
      el.selected = selected.has(el.value)

    // Note that some browser implementations might not reduce
    // the number of visible options for size <= 3.
    this.selectEl.size = this.model.size
  }

  change_input(): void {
    const is_focused = this.el.querySelector('select:focus') != null

    const values = []
    for (const el of Array.from(this.el.querySelectorAll('option'))) {
      if (el.selected)
        values.push(el.value)
    }

    this.model.value = values
    super.change_input()
    // Restore focus back to the <select> afterwards,
    // so that even if python on_change callback is invoked,
    // focus remains on <select> and one can seamlessly scroll
    // up/down.
    if (is_focused)
      this.selectEl.focus()
  }
}

export namespace MultiSelect {
  export interface Attrs extends InputWidget.Attrs {
    value: string[]
    options: (string | [string, string])[]
    size: number
  }

  export interface Props extends InputWidget.Props {
    value: p.Property<string[]>
    options: p.Property<(string | [string, string])[]>
    size: p.Property<number>
  }
}

export interface MultiSelect extends MultiSelect.Attrs {}

export class MultiSelect extends InputWidget {

  properties: MultiSelect.Props

  constructor(attrs?: Partial<MultiSelect.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "MultiSelect"
    this.prototype.default_view = MultiSelectView

    this.define({
      value:   [ p.Array, [] ],
      options: [ p.Array, [] ],
      size:    [ p.Number, 4 ], // 4 is the HTML default
    })
  }
}

MultiSelect.initClass()
