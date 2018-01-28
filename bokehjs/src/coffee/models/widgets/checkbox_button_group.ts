/* XXX: partial */
import {empty, input, label, div} from "core/dom"
import * as p from "core/properties"
import {includes} from "core/util/array"

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
      if (includes(active, i))
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

export namespace CheckboxButtonGroup {
  export interface Attrs extends Widget.Attrs {
    active: number[]
    labels: string[]
    button_type: ButtonType
    callback: any // XXX
  }

  export interface Opts extends Widget.Opts {}
}

export interface CheckboxButtonGroup extends CheckboxButtonGroup.Attrs {}

export class CheckboxButtonGroup extends Widget {

  constructor(attrs?: Partial<CheckboxButtonGroup.Attrs>, opts?: CheckboxButtonGroup.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "CheckboxButtonGroup"
    this.prototype.default_view = CheckboxButtonGroupView

    this.define({
      active:      [ p.Array,  []        ],
      labels:      [ p.Array,  []        ],
      button_type: [ p.String, "default" ],
      callback:    [ p.Instance          ],
    })
  }
}

CheckboxButtonGroup.initClass()
