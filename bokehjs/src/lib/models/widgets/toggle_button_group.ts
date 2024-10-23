import {OrientedControl, OrientedControlView} from "./oriented_control"
import {ButtonClick} from "core/bokeh_events"
import {ButtonType} from "core/enums"
import type {StyleSheetLike} from "core/dom"
import {button, div} from "core/dom"
import type * as p from "core/properties"

import buttons_css, * as buttons from "styles/buttons.css"

export abstract class ToggleButtonGroupView extends OrientedControlView {
  declare model: ToggleButtonGroup

  protected _buttons: HTMLElement[]
  *controls() {
    yield* (this._buttons as any) // TODO: HTMLButtonElement[]
  }

  override connect_signals(): void {
    super.connect_signals()

    const p = this.model.properties
    this.on_change(p.button_type, () => this.rerender())
    this.on_change(p.labels,      () => this.rerender())
    this.on_change(p.active,      () => this._update_active())
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), buttons_css]
  }

  override render(): void {
    super.render()

    this._buttons = this.model.labels.map((label, i) => {
      const button_el = button({
        class: [buttons.btn, buttons[`btn_${this.model.button_type}` as const]],
        disabled: this.model.disabled,
      }, label)
      button_el.addEventListener("click", () => {
        this.change_active(i)
        this.model.trigger_event(new ButtonClick())
      })
      return button_el
    })

    this._update_active()

    const orient = this.model.orientation == "horizontal" ? buttons.horizontal : buttons.vertical
    const group = div({class: [buttons.btn_group, orient]}, this._buttons)
    this.shadow_el.appendChild(group)
  }

  abstract change_active(i: number): void

  protected abstract _update_active(): void
}

export namespace ToggleButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OrientedControl.Props & {
    labels: p.Property<string[]>
    button_type: p.Property<ButtonType>
  }
}

export interface ToggleButtonGroup extends ToggleButtonGroup.Attrs {}

export abstract class ToggleButtonGroup extends OrientedControl {
  declare properties: ToggleButtonGroup.Props & {active: p.Property<unknown>}
  declare __view_type__: ToggleButtonGroupView

  constructor(attrs?: Partial<ToggleButtonGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToggleButtonGroup.Props>(({Str, List}) => ({
      labels:      [ List(Str), [] ],
      button_type: [ ButtonType, "default" ],
    }))
  }
}
