import {OrientedControl, OrientedControlView} from "./oriented_control"

import {ButtonType} from "core/enums"
import {div} from "core/dom"
import * as p from "core/properties"

import buttons_css, * as buttons from "styles/buttons.css"

export abstract class ButtonGroupView extends OrientedControlView {
  override model: ButtonGroup

  protected override get default_size(): number | undefined {
    return this.orientation == "horizontal" ? super.default_size : undefined
  }

  protected _buttons: HTMLElement[]
  *controls() {
    yield* (this._buttons as any) // TODO: HTMLButtonElement[]
  }

  override connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.button_type, () => this.render())
    this.on_change(p.labels,      () => this.render())
    this.on_change(p.active,      () => this._update_active())
  }

  override styles(): string[] {
    return [...super.styles(), buttons_css]
  }

  override render(): void {
    super.render()

    this._buttons = this.model.labels.map((label, i) => {
      const button = div({
        class: [buttons.btn, buttons[`btn_${this.model.button_type}` as const]],
        disabled: this.model.disabled,
      }, label)
      button.addEventListener("click", () => this.change_active(i))
      return button
    })

    this._update_active()

    const orient = this.model.orientation == "horizontal" ? buttons.horizontal : buttons.vertical
    const group = div({class: [buttons.btn_group, orient]}, this._buttons)
    this.el.appendChild(group)
  }

  abstract change_active(i: number): void

  protected abstract _update_active(): void
}

export namespace ButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OrientedControl.Props & {
    labels: p.Property<string[]>
    button_type: p.Property<ButtonType>
  }
}

export interface ButtonGroup extends ButtonGroup.Attrs {}

export abstract class ButtonGroup extends OrientedControl {
  override properties: ButtonGroup.Props & {active: p.Property<unknown>}
  override __view_type__: ButtonGroupView

  constructor(attrs?: Partial<ButtonGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ButtonGroup.Props>(({String, Array}) => ({
      labels:      [ Array(String), [] ],
      button_type: [ ButtonType, "default" ],
    }))
  }
}
