import {ToggleInput, ToggleInputView} from "./toggle_input"
import {IconLike} from "../common/kinds"
import type {Keys} from "core/dom"
import {UIComponent, Icon, cls} from "core/vdom"
import type {StyleSheetLike} from "core/stylesheets"
import type * as p from "core/properties"
import * as icons_css from "styles/icons.css"
import * as switch_css from "styles/widgets/switch.css"
import * as toggle_css from "styles/widgets/toggle_input.css"

import type {VNode, TargetedEvent} from "preact"

export class SwitchView extends ToggleInputView {
  declare readonly model: Switch
  declare readonly signals: p.SignalsOf<Switch.Props>
  declare readonly values: Switch.Attrs

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css.default, switch_css.default]
  }

  override component(): VNode {
    const {active, disabled, on_icon, off_icon, indeterminate_icon} = this.values
    const {label} = this.signals

    const active_cls = active != null && active ? switch_css.active : null
    const disabled_cls = disabled ? switch_css.disabled : null
    const indeterminate_cls = active == null ? switch_css.indeterminate : null
    const icon = active != null && active ? on_icon : active == null ? indeterminate_icon : off_icon
    const aria_checked = active != null && active ? "true" : active == null ? "mixed" : "false"

    return (
      <UIComponent parent={this.resolved_props} class={cls(active_cls, disabled_cls, indeterminate_cls)} role="switch" aria-checked={aria_checked}>
        <div class={toggle_css.label}>{label}</div>
        {icon != null ? <Icon classes={switch_css.icon} icon={icon}></Icon> : null}
        <div class={switch_css.body} onClick={() => this._toggle_active()} onKeyDown={this.on_key_down}>
          <div class={switch_css.bar}></div>
          <div class={switch_css.knob} tabIndex={0}></div>
        </div>
      </UIComponent>
    )
  }

  on_key_down(event: TargetedEvent<HTMLElement, KeyboardEvent>): void {
    switch (event.key as Keys) {
      case "Enter":
      case " ": {
        event.preventDefault()
        this._toggle_active()
        break
      }
      default:
    }
  }
}

export namespace Switch {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ToggleInput.Props & {
    on_icon: p.Property<IconLike | null>
    off_icon: p.Property<IconLike | null>
    indeterminate_icon: p.Property<IconLike | null>
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
      indeterminate_icon: [ Nullable(IconLike), null ],
    }))
  }
}
