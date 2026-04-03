import {ToggleInput, ToggleInputView} from "./toggle_input"
import {IconLike} from "../common/kinds"
import type {Keys} from "core/dom"
import {ShadowComponent, Icon, cls} from "core/vdom"
import type {StyleSheetLike} from "core/stylesheets"
import type {FullDisplay} from "models/layouts/layout_dom"
import type * as p from "core/properties"
import * as icons_css from "styles/icons.css"
import * as switch_css from "styles/widgets/switch.css"
import * as toggle_css from "styles/widgets/toggle_input.css"

import type {VNode, TargetedEvent} from "preact"
import {Component} from "preact"

export class SwitchView extends ToggleInputView {
  declare readonly model: Switch
  declare readonly signals: p.SignalsOf<Switch.Props>

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css.default, switch_css.default]
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "flex"} // duplicates `display: flex`
  }

  override component(): VNode {
    const view = this

    type SwitchProps = {
      /*
      active: boolean
      label?: string
      disabled?: boolean
      on_icon?: IconLike | null
      off_icon?: IconLike | null
      */
    }

    const classes = [...this._css_classes()]
    const stylesheets = this.resolved_stylesheets

    class ShadowSwitch extends Component<SwitchProps> {
      render(): VNode {
        const {active, label, disabled, on_icon, off_icon} = view.signals
        const active_cls = active.value ? switch_css.active : null
        const disabled_cls = disabled.value ? switch_css.disabled : null
        const icon = active.value ? on_icon : off_icon
        return (
          <ShadowComponent stylesheets={stylesheets} class={cls(classes, active_cls, disabled_cls)} role="switch" aria-checked={active}>
            <div class={toggle_css.label}>{label}</div>
            {icon.value != null ? <Icon classes={switch_css.icon} icon={icon.value}></Icon> : null}
            <div class={switch_css.body} onClick={() => view._toggle_active()} onKeyDown={this.on_key_down}>
              <div class={switch_css.bar}></div>
              <div class={switch_css.knob} tabIndex={0}></div>
            </div>
          </ShadowComponent>
        )
      }

      on_key_down(event: TargetedEvent<HTMLElement, KeyboardEvent>): void {
        switch (event.key as Keys) {
          case "Enter":
          case " ": {
            event.preventDefault()
            view._toggle_active()
            break
          }
          default:
        }
      }
    }

    return <ShadowSwitch></ShadowSwitch>
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
