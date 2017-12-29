import {empty, input, label, div} from "core/dom"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"
import {ButtonType} from "./abstract_button"

export class CheckboxButtonGroupView extends WidgetView {
  model: CheckboxButtonGroup

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()

    empty(this.el)
    const divEl = div({class: "bk-bs-btn-group"})
    this.el.appendChild(divEl)

    const active = this.model.active
    for (let i = 0; i < this.model.labels.length; i++) {
      const text = this.model.labels[i]
      const inputEl = input({type: `checkbox`, value: `${i}`, checked: i in active})
      inputEl.addEventListener("change", () => this.change_input())
      const labelEl = label({class: [`bk-bs-btn`, `bk-bs-btn-${this.model.button_type}`]}, inputEl, text)
      if (contains(active, i))
        labelEl.classList.add("bk-bs-active")
      divEl.appendChild(labelEl)
    }
  }

  change_input(): void {
    const checkboxes = this.el.querySelectorAll("input")
    const active: number[] = []
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i]
      if (checkbox.checked)
        active.push(i)
    }
    this.model.active = active
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export class CheckboxButtonGroup extends Widget {
  active: number[]
  labels: string[]
  button_type: ButtonType
  callback: any // XXX
}

CheckboxButtonGroup.prototype.type = "CheckboxButtonGroup"
CheckboxButtonGroup.prototype.default_view = CheckboxButtonGroupView

CheckboxButtonGroup.define({
  active:      [ p.Array,  []        ],
  labels:      [ p.Array,  []        ],
  button_type: [ p.String, "default" ],
  callback:    [ p.Instance          ],
})
