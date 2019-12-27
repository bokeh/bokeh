import Choices from "choices.js"

import {select, option} from "core/dom"
import {isString} from "core/util/types"
import {Set} from "core/util/data_structures"
import * as p from "core/properties"
import {bk_input} from "styles/widgets/inputs"
import "styles/widgets/choices"

import {InputWidget, InputWidgetView} from "./input_widget"

export class PillboxView extends InputWidgetView {
  model: Pillbox

  protected select_el: HTMLSelectElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.options.change, () => this.render())
    this.connect(this.model.properties.name.change, () => this.render())
    this.connect(this.model.properties.title.change, () => this.render())
    this.connect(this.model.properties.disabled.change, () => this.render())
  }

  render(): void {
    super.render()

    const options = this.model.options.map((opt) => {
      let value, _label
      if (isString(opt))
        value = _label  = opt
      else
        [value, _label] = opt

      return option({value}, _label)
    })

    this.select_el = select({
      multiple: true,
      class: bk_input,
      name: this.model.name,
      disabled: this.model.disabled
    }, options)

    this.group_el.appendChild(this.select_el)
    this.render_selection()
    new Choices(this.select_el, {removeItemButton: true})
    this.select_el.addEventListener("change", () => this.change_input())
  }
  
  render_selection(): void {
    const selected = new Set(this.model.value)

    for (const el of Array.from(this.el.querySelectorAll('option')))
      el.selected = selected.has(el.value)
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
      this.select_el.focus()
  }
}

export namespace Pillbox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string[]>
    options: p.Property<(string | [string, string])[]>
    size: p.Property<number>
  }
}

export interface Pillbox extends Pillbox.Attrs {}

export class Pillbox extends InputWidget {
  properties: Pillbox.Props

  constructor(attrs?: Partial<Pillbox.Attrs>) {
    super(attrs)
  }

  static init_Pillbox(): void {
    this.prototype.default_view = PillboxView

    this.define<Pillbox.Props>({
      value:   [ p.Array, [] ],
      options: [ p.Array, [] ]
    })
  }
}
