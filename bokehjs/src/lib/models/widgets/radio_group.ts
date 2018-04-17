import {empty, input, label, div} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export class RadioGroupView extends WidgetView {
  model: RadioGroup

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

    const name = uniqueId()

    const active = this.model.active
    const labels = this.model.labels

    for (let i = 0; i < labels.length; i++) {
      const text = labels[i]

      const inputEl = input({type: `radio`, name: name, value: `${i}`})
      inputEl.addEventListener("change", () => this.change_input())

      if (this.model.disabled)
        inputEl.disabled = true
      if (i == active)
        inputEl.checked = true

      const labelEl = label({}, inputEl, text)
      if (this.model.inline) {
        labelEl.classList.add("bk-bs-radio-inline")
        this.el.appendChild(labelEl)
      } else {
        const divEl = div({class: "bk-bs-radio"}, labelEl)
        this.el.appendChild(divEl)
      }
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

export namespace RadioGroup {
  export interface Attrs extends Widget.Attrs {
    active: number
    labels: string[]
    inline: boolean
    callback: any // XXX
  }

  export interface Props extends Widget.Props {}
}

export interface RadioGroup extends RadioGroup.Attrs {}

export class RadioGroup extends Widget {

  properties: RadioGroup.Props

  constructor(attrs?: Partial<RadioGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "RadioGroup"
    this.prototype.default_view = RadioGroupView

    this.define({
      active:   [ p.Any,   null  ], // TODO (bev) better type?
      labels:   [ p.Array, []    ],
      inline:   [ p.Bool,  false ],
      callback: [ p.Instance ],
    })
  }
}

RadioGroup.initClass()
