import {Control, ControlView} from "./control"

import {ButtonType} from "core/enums"
import {div} from "core/dom"
import * as p from "core/properties"

import {bk_btn, bk_btn_group, bk_btn_type} from "styles/buttons"
import buttons_css from "styles/buttons.css"

export abstract class ButtonGroupView extends ControlView {
  model: ButtonGroup

  protected _buttons: HTMLElement[]
  *controls() {
    yield* (this._buttons as any) // TODO: HTMLButtonElement[]
  }

  connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.button_type, () => this.render())
    this.on_change(p.labels,      () => this.render())
    this.on_change(p.active,      () => this._update_active())
  }

  styles(): string[] {
    return [...super.styles(), buttons_css]
  }

  render(): void {
    super.render()

    this._buttons = this.model.labels.map((label, i) => {
      const button = div({
        class: [bk_btn, bk_btn_type(this.model.button_type)],
        disabled: this.model.disabled,
      }, label)
      button.addEventListener("click", () => this.change_active(i))
      return button
    })

    this._update_active()

    const group = div({class: bk_btn_group}, this._buttons)
    this.el.appendChild(group)
  }

  abstract change_active(i: number): void

  protected abstract _update_active(): void
}

export namespace ButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Control.Props & {
    labels: p.Property<string[]>
    button_type: p.Property<ButtonType>
  }
}

export interface ButtonGroup extends ButtonGroup.Attrs {}

export abstract class ButtonGroup extends Control {
  properties: ButtonGroup.Props & {active: p.Property<unknown>}
  __view_type__: ButtonGroupView

  constructor(attrs?: Partial<ButtonGroup.Attrs>) {
    super(attrs)
  }

  static init_ButtonGroup(): void {
    this.define<ButtonGroup.Props>({
      labels:      [ p.Array,      []        ],
      button_type: [ p.ButtonType, "default" ],
    })
  }
}
