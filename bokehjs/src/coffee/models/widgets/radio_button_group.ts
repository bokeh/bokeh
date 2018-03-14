import {empty, input, label, div} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"
import {ButtonType} from "./abstract_button"

export class RadioButtonGroupView extends WidgetView {
  model: RadioButtonGroup

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

    const name = uniqueId()

    const active = this.model.active
    const labels = this.model.labels

    for (let i = 0; i < labels.length; i++) {
      const text = labels[i]
      const inputEl = input({type: `radio`, name: name, value: `${i}`, checked: i == active})
      inputEl.addEventListener("change", () => this.change_input())
      const labelEl = label({class: [`bk-bs-btn`, `bk-bs-btn-${this.model.button_type}`]}, inputEl, text)
      if (i == active)
        labelEl.classList.add("bk-bs-active")
      divEl.appendChild(labelEl)
    }
  }

  change_input(): void {
    const radios = this.el.querySelectorAll("input")
    const active: number[] = []
    for (let i = 0; i < radios.length; i++) {
      const radio = radios[i]
      if (radio.checked)
        active.push(i)
    }
    this.model.active = active[0]
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace RadioButtonGroup {
  export interface Attrs extends Widget.Attrs {
    active: number
    labels: string[]
    button_type: ButtonType
    callback: any // XXX
  }

  export interface Props extends Widget.Props {}
}

export interface RadioButtonGroup extends RadioButtonGroup.Attrs {}

export class RadioButtonGroup extends Widget {

  properties: RadioButtonGroup.Props

  constructor(attrs?: Partial<RadioButtonGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "RadioButtonGroup"
    this.prototype.default_view = RadioButtonGroupView

    this.define({
      active:      [ p.Any,    null      ], // TODO (bev) better type?
      labels:      [ p.Array,  []        ],
      button_type: [ p.String, "default" ],
      callback:    [ p.Instance ],
    })
  }
}

RadioButtonGroup.initClass()
