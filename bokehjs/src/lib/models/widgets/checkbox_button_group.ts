import {empty, input, label, div} from "core/dom"
import * as p from "core/properties"
import {copy, includes, removeBy} from "core/util/array"

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
    const labels = this.model.labels

    for (let i = 0; i < labels.length; i++) {
      const inputEl = input({type: `checkbox`, value: `${i}`, checked: i in active})
      inputEl.addEventListener("change", () => this.model.change_input(i))
      const labelEl = label({class: [`bk-bs-btn`, `bk-bs-btn-${this.model.button_type}`]}, inputEl, labels[i])
      if (includes(active, i))
        labelEl.classList.add("bk-bs-active")
      divEl.appendChild(labelEl)
    }
  }

}

export namespace CheckboxButtonGroup {
  export interface Attrs extends Widget.Attrs {
    active: number[]
    labels: string[]
    button_type: ButtonType
    callback: any // XXX
  }

  export interface Props extends Widget.Props {}
}

export interface CheckboxButtonGroup extends CheckboxButtonGroup.Attrs {}

export class CheckboxButtonGroup extends Widget {

  properties: CheckboxButtonGroup.Props

  constructor(attrs?: Partial<CheckboxButtonGroup.Attrs>) {
    super(attrs)
  }

  change_input(i: number): void {
    const active = copy(this.active)

    if (includes(active, i))
      removeBy(active, (j) => i == j)
    else
      active.push(i)

    active.sort()

    this.active = active

    if (this.callback != null)
      this.callback.execute(this)
  }

  static initClass(): void {
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
