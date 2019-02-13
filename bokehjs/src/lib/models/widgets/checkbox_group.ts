import {Widget, WidgetView} from "./widget"
import {CallbackLike0} from "../callbacks/callback"

import {input, label, div, span} from "core/dom"
import {includes} from "core/util/array"
import {Set} from "core/util/data_structures"
import * as p from "core/properties"

export class CheckboxGroupView extends WidgetView {
  model: CheckboxGroup

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()

    const group = div({class: ["bk-input-group", this.model.inline ? "bk-inline" : null]})
    this.el.appendChild(group)

    const {active, labels} = this.model

    for (let i = 0; i < labels.length; i++) {
      const checkbox = input({type: `checkbox`, value: `${i}`})
      checkbox.addEventListener("change", () => this.change_active(i))

      if (this.model.disabled)
        checkbox.disabled = true

      if (includes(active, i))
        checkbox.checked = true

      const labelEl = label({}, checkbox, span({}, labels[i]))
      group.appendChild(labelEl)
    }
  }

  change_active(i: number): void {
    const active = new Set(this.model.active)
    active.toggle(i)
    this.model.active = active.values

    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace CheckboxGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    active: p.Property<number[]>
    labels: p.Property<string[]>
    inline: p.Property<boolean>
    callback: p.Property<CallbackLike0<CheckboxGroup> | null>
  }
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

    this.define<CheckboxGroup.Props>({
      active:   [ p.Array,   []    ],
      labels:   [ p.Array,   []    ],
      inline:   [ p.Boolean, false ],
      callback: [ p.Any            ],
    })
  }
}
CheckboxGroup.initClass()
