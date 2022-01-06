import {Widget, WidgetView} from "./widget"
import {div} from "core/dom"

import * as p from "core/properties"
import switch_css from "styles/widgets/switch.css"

export class SwitchView extends WidgetView {
  override model: Switch

  protected knob_el: HTMLElement
  protected bar_el: HTMLElement

  override connect_signals(): void {
    super.connect_signals()

    const {active, disabled} = this.model.properties
    this.on_change(active, () => this._update_active())
    this.on_change(disabled, () => this._update_disabled())

    this.el.addEventListener("click", () => {
      if (!this.model.disabled) {
        this.model.active = !this.model.active
      }
    })
  }

  override styles(): string[] {
    return [...super.styles(), switch_css]
  }

  override render(): void {
    super.render()
    this.knob_el = div({class: "knob"})
    this.bar_el = div({class: "bar"}, this.knob_el)
    this.shadow_el.appendChild(this.bar_el)
    this._update_active()
    this._update_disabled()
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

  export type Props = Widget.Props & {
    active: p.Property<boolean>
  }
}

export interface Switch extends Switch.Attrs {}

export class Switch extends Widget {
  override properties: Switch.Props
  override __view_type__: SwitchView

  constructor(attrs?: Partial<Switch.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SwitchView

    this.define<Switch.Props>(({Boolean}) => ({
      active: [ Boolean, false ],
    }))

    this.override<Switch.Props>({
      width: 32,
    })
  }
}
