import {Widget, WidgetView} from "./widget"
import {ButtonType} from "./abstract_button"

import {div} from "core/dom"
import * as p from "core/properties"

export class RadioButtonGroupView extends WidgetView {
  model: RadioButtonGroup

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
        class: [`bk-btn`, `bk-btn-${this.model.button_type}`, i == active ? "bk-active" : null],
        disabled: this.model.disabled,
      }, labels[i])
      button.addEventListener("click", () => this.change_active(i))
      group.appendChild(button)
    }
  }

  change_active(i: number): void {
    this.model.active = i
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
      active:      [ p.Any,     null      ], // TODO (bev) better type?
      labels:      [ p.Array,   []        ],
      button_type: [ p.String,  "default" ],
      callback:    [ p.Instance           ],
    })
  }
}
RadioButtonGroup.initClass()
