import {ToggleInput, ToggleInputView} from "./toggle_input"
import {div, StyleSheetLike, Keys} from "core/dom"
import * as p from "core/properties"
import switch_css from "styles/widgets/switch.css"

export class SwitchView extends ToggleInputView {
  override model: Switch

  protected knob_el: HTMLElement
  protected bar_el: HTMLElement

  override styles(): StyleSheetLike[] {
    return [...super.styles(), switch_css]
  }

  override connect_signals(): void {
    super.connect_signals()

    this.el.addEventListener("keydown", (event) => {
      switch (event.keyCode) {
        case Keys.Enter:
        case Keys.Space: {
          event.preventDefault()
          this._toggle_active()
          break
        }
      }
    })
    this.el.addEventListener("click", () => this._toggle_active())
  }

  override render(): void {
    super.render()
    this.knob_el = div({class: "knob", tabIndex: 0})
    this.bar_el = div({class: "bar"}, this.knob_el)
    this._update_active()
    this._update_disabled()
    this.shadow_el.appendChild(this.bar_el)
  }

  protected _update_active(): void {
    this.el.classList.toggle("active", this.model.active)
  }

  protected _update_disabled(): void {
    this.el.classList.toggle("disabled", this.model.disabled)
  }
}

export namespace Switch {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ToggleInput.Props
}

export interface Switch extends Switch.Attrs {}

export class Switch extends ToggleInput {
  override properties: Switch.Props
  override __view_type__: SwitchView

  constructor(attrs?: Partial<Switch.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SwitchView

    this.override<Switch.Props>({
      width: 32,
    })
  }
}
