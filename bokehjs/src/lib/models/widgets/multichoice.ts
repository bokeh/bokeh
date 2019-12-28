import Choices from "choices.js"
import {Choices as ChoicesNS} from "choices.js"

import {select, option} from "core/dom"
import {isString} from "core/util/types"
import * as p from "core/properties"
import {bk_input} from "styles/widgets/inputs"
import "styles/widgets/choices"

import {InputWidget, InputWidgetView} from "./input_widget"

export class MultiChoiceView extends InputWidgetView {
  model: MultiChoice

  protected select_el: HTMLSelectElement
  protected choice_el: Choices

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.value.change, () => this.render_selection())
    this.connect(this.model.properties.disabled.change, () => this.set_disabled())
    this.connect(this.model.properties.max_items.change, () => this.render())
    this.connect(this.model.properties.option_limit.change, () => this.render())
    this.connect(this.model.properties.delete_button.change, () => this.render())
    this.connect(this.model.properties.placeholder.change, () => this.render())
    this.connect(this.model.properties.options.change, () => this.render())
    this.connect(this.model.properties.name.change, () => this.render())
    this.connect(this.model.properties.title.change, () => this.render())
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
      disabled: this.model.disabled,
    }, options)

    this.group_el.appendChild(this.select_el)
    this.render_selection()

    const opts: Partial<ChoicesNS.Options> = {
      removeItemButton: this.model.delete_button,
    }
    if (this.model.placeholder !== null)
      opts["placeholderValue"] = this.model.placeholder
    if (this.model.max_items !== null)
      opts["maxItemCount"] = this.model.max_items
    if (this.model.option_limit !== null)
      opts["renderChoiceLimit"] = this.model.option_limit
    this.choice_el = new Choices(this.select_el, opts)
    this.select_el.addEventListener("change", () => this.change_input())
  }

  render_selection(): void {
    const selected = new Set(this.model.value)
    for (const el of Array.from(this.el.querySelectorAll('option')))
      el.selected = selected.has(el.value)
  }

  set_disabled(): void {
    if (this.model.disabled)
      this.choice_el.disable()
    else
      this.choice_el.enable()
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

export namespace MultiChoice {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string[]>
    options: p.Property<(string | [string, string])[]>
    max_items: p.Property<number| null>
    delete_button: p.Property<boolean>
    placeholder: p.Property<string | null>
    option_limit: p.Property<number | null>
  }
}

export interface MultiChoice extends MultiChoice.Attrs {}

export class MultiChoice extends InputWidget {
  properties: MultiChoice.Props

  constructor(attrs?: Partial<MultiChoice.Attrs>) {
    super(attrs)
  }

  static init_MultiChoice(): void {
    this.prototype.default_view = MultiChoiceView

    this.define<MultiChoice.Props>({
      value:         [ p.Array,   []   ],
      options:       [ p.Array,   []   ],
      max_items:     [ p.Number,  null ],
      delete_button: [ p.Boolean, true ],
      placeholder:   [ p.String,  null ],
      option_limit:  [ p.Number,  null ],
    })
  }
}
