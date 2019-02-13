import {Widget, WidgetView} from "./widget"
import {CallbackLike0} from "../callbacks/callback"

import {ButtonType} from "core/enums"
import {div} from "core/dom"
import * as p from "core/properties"

export abstract class ButtonGroupView extends WidgetView {
  model: ButtonGroup

  protected _buttons: HTMLElement[]

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.labels.change,      () => this.render())
    this.connect(this.model.properties.button_type.change, () => this.render())
  }

  render(): void {
    super.render()

    this._buttons = this.model.labels.map((label, i) => {
      const button = div({
        class: [`bk-btn`, `bk-btn-${this.model.button_type}`],
        disabled: this.model.disabled,
        style: {
          width: "100%",
          height: "100%",
        },
      }, label)
      button.addEventListener("click", () => this.change_active(i))
      return button
    })

    this._update_active()

    const group = div({class: "bk-btn-group"}, this._buttons)
    this.el.appendChild(group)
  }

  abstract change_active(i: number): void

  protected abstract _update_active(): void
}

export namespace ButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    labels: p.Property<string[]>
    button_type: p.Property<ButtonType>
    callback: p.Property<CallbackLike0<ButtonGroup> | null>
  }
}

export interface ButtonGroup extends ButtonGroup.Attrs {}

export abstract class ButtonGroup extends Widget {
  properties: ButtonGroup.Props

  constructor(attrs?: Partial<ButtonGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ButtonGroup"

    this.define<ButtonGroup.Props>({
      labels:      [ p.Array,      []        ],
      button_type: [ p.ButtonType, "default" ],
      callback:    [ p.Any                   ],
    })

    this.override({
      width: 300,
    })
  }
}
ButtonGroup.initClass()
