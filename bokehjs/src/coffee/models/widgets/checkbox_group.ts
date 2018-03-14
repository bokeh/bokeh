import {empty, input, label, div} from "core/dom"
import * as p from "core/properties"
import {includes} from "core/util/array"

import {Widget, WidgetView} from "./widget"

export class CheckboxGroupView extends WidgetView {
  model: CheckboxGroup

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

    const active = this.model.active
    const labels = this.model.labels

    for (let i = 0; i < labels.length; i++) {
      const text = labels[i]

      const inputEl = input({type: `checkbox`, value: `${i}`})
      inputEl.addEventListener("change", () => this.change_input())

      if (this.model.disabled)
        inputEl.disabled = true

      if (includes(active, i))
        inputEl.checked = true

      const labelEl = label({}, inputEl, text)
      if (this.model.inline) {
        labelEl.classList.add("bk-bs-checkbox-inline")
        this.el.appendChild(labelEl)
      } else {
        const divEl = div({class: "bk-bs-checkbox"}, labelEl)
        this.el.appendChild(divEl)
      }
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

export namespace CheckboxGroup {
  export interface Attrs extends Widget.Attrs {
    active: number[]
    labels: string[]
    inline: boolean
    callback: any // XXX
  }

  export interface Props extends Widget.Props {}
}

export interface CheckboxGroup extends CheckboxGroup.Attrs {}

export class CheckboxGroup extends Widget {

  properties: CheckboxGroup.Props

  constructor(attrs?: Partial<CheckboxGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CheckboxGroup"
    this.prototype.default_view = CheckboxGroupView

    this.define({
      active:   [ p.Array, []    ],
      labels:   [ p.Array, []    ],
      inline:   [ p.Bool,  false ],
      callback: [ p.Instance     ],
    })
  }
}

CheckboxGroup.initClass()
