import {input, label, div} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"
import {CallbackLike} from "../callbacks/callback"

export class RadioGroupView extends WidgetView {
  model: RadioGroup

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()

    const group = div({class: ["bk-input-group", this.model.inline ? "bk-inline" : null]})
    this.el.appendChild(group)

    const name = uniqueId()
    const {active, labels} = this.model

    for (let i = 0; i < labels.length; i++) {
      const radio = input({type: `radio`, name: name, value: `${i}`})
      radio.addEventListener("change", () => this.change_active(i))

      if (this.model.disabled)
        radio.disabled = true
      if (i == active)
        radio.checked = true

      const labelEl = label({}, radio, labels[i])
      group.appendChild(labelEl)
    }
  }

  change_active(i: number): void {
    this.model.active = i
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace RadioGroup {
  export interface Attrs extends Widget.Attrs {
    active: number
    labels: string[]
    inline: boolean
    callback: CallbackLike<RadioGroup> | null
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
      callback: [ p.Any          ],
    })
  }
}

RadioGroup.initClass()
