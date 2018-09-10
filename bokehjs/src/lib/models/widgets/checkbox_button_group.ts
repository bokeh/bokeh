import {Widget, WidgetView} from "./widget"
import {ButtonType} from "./abstract_button"

import {Class} from "core/class"
import {div} from "core/dom"
import {includes} from "core/util/array"
import {Set} from "core/util/data_structures"
import * as p from "core/properties"

export namespace CheckboxButtonGroupView {
  export type Options = WidgetView.Options & {model: CheckboxButtonGroup}
}

export class CheckboxButtonGroupView extends WidgetView {
  model: CheckboxButtonGroup

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  render(): void {
    super.render()

    const group = div({class: "bk-btn-group"})
    this.el.appendChild(group)

    const {active, labels} = this.model

    for (let i = 0; i < labels.length; i++) {
      const button = div({
        class: [`bk-btn`, `bk-btn-${this.model.button_type}`, includes(active, i) ? "bk-active" : null],
        disabled: this.model.disabled,
      }, labels[i])
      button.addEventListener("click", () => this.change_active(i))
      group.appendChild(button)
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
  default_view: Class<CheckboxButtonGroupView, [CheckboxButtonGroupView.Options]>

  constructor(attrs?: Partial<CheckboxButtonGroup.Attrs>) {
    super(attrs)
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
