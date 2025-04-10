import {ToggleInput, ToggleInputView} from "./toggle_input"
import {IconLike} from "../common/kinds"
import {apply_icon} from "../common/resolve"
import type {FullDisplay} from "../layouts/layout_dom"
import type {StyleSheetLike, Keys} from "core/dom"
import {div, undisplay} from "core/dom"
import type * as p from "core/properties"
import * as icons_css from "styles/icons.css"
import * as switch_css from "styles/widgets/switch.css"

export class SwitchView extends ToggleInputView {
  declare model: Switch

  protected icon_el: HTMLElement
  protected body_el: HTMLElement
  protected bar_el: HTMLElement
  protected knob_el: HTMLElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css.default, switch_css.default]
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "flex"} // duplicates `display: flex`
  }

  override render(): void {
    super.render()

    this.bar_el = div({class: switch_css.bar})
    this.knob_el = div({class: switch_css.knob, tabIndex: 0})
    this.icon_el = div({class: switch_css.icon})
    this.body_el = div({class: switch_css.body}, this.bar_el, this.knob_el)
    this.shadow_el.append(this.label_el, this.icon_el, this.body_el)

    this._update_label()
    this._update_active()
    this._update_disabled()

    this.body_el.addEventListener("click", () => this._toggle_active())
    this.knob_el.addEventListener("keydown", (event) => {
      switch (event.key as Keys) {
        case "Enter":
        case " ": {
          event.preventDefault()
          this._toggle_active()
          break
        }
        default:
      }
    })
  }

  protected _apply_icon(icon: IconLike | null): void {
    if (icon != null) {
      const icon_el = div({class: switch_css.icon})
      this.icon_el.replaceWith(icon_el)
      this.icon_el = icon_el
      apply_icon(this.icon_el, icon)
    } else {
      undisplay(this.icon_el)
    }
  }

  protected _update_active(): void {
    const {active, on_icon, off_icon} = this.model
    this.el.classList.toggle(switch_css.active, active)
    this._apply_icon(active ? on_icon : off_icon)
  }

  protected _update_disabled(): void {
    this.el.classList.toggle(switch_css.disabled, this.model.disabled)
  }
}

export namespace Switch {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ToggleInput.Props & {
    on_icon: p.Property<IconLike | null>
    off_icon: p.Property<IconLike | null>
  }
}

export interface Switch extends Switch.Attrs {}

export class Switch extends ToggleInput {
  declare properties: Switch.Props
  declare __view_type__: SwitchView

  constructor(attrs?: Partial<Switch.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SwitchView

    this.define<Switch.Props>(({Nullable}) => ({
      on_icon: [ Nullable(IconLike), null ],
      off_icon: [ Nullable(IconLike), null ],
    }))
  }
}
