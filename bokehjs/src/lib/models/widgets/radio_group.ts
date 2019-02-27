import {input, label, div, span} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"
import {CallbackLike0} from "../callbacks/callback"

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
      const radio = input({type: `radio`, name, value: `${i}`})
      radio.addEventListener("change", () => this.change_active(i))

      if (this.model.disabled)
        radio.disabled = true
      if (i == active)
        radio.checked = true

      const label_el = label({}, radio, span({}, labels[i]))
      group.appendChild(label_el)
    }
  }

  change_active(i: number): void {
    this.model.active = i
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace RadioGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    active: p.Property<number>
    labels: p.Property<string[]>
    inline: p.Property<boolean>
    callback: p.Property<CallbackLike0<RadioGroup> | null>
  }
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

    this.define<RadioGroup.Props>({
      active:   [ p.Number,        ],
      labels:   [ p.Array,   []    ],
      inline:   [ p.Boolean, false ],
      callback: [ p.Any            ],
    })
  }
}
RadioGroup.initClass()
