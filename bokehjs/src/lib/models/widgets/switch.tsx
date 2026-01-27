import {ToggleInput, ToggleInputView} from "./toggle_input"
import {IconLike} from "../common/kinds"
import type {StyleSheetLike, Keys} from "core/dom"
import {InlineStyleSheet} from "core/dom"
import {ShadowComponent, Icon, cls} from "core/vdom"
import {isString} from "core/util/types"
import type * as p from "core/properties"
import * as icons_css from "styles/icons.css"
import * as switch_css from "styles/widgets/switch.css"
import * as toggle_css from "styles/widgets/toggle_input.css"

import type {VNode, TargetedEvent} from "preact"
import {Component, render} from "preact"
import {signal} from "@preact/signals"
import type {Signal} from "@preact/signals"

export class SwitchView extends ToggleInputView {
  declare model: Switch

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css.default, switch_css.default]
  }

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.change, () => {
      this.signals.active.value = this.model.active
      this.signals.disabled.value = this.model.disabled
      this.signals.label.value = this.model.label
      this.signals.on_icon.value = this.model.on_icon
      this.signals.off_icon.value = this.model.off_icon
    })
  }

  // TODO readonly; initialize in-place
  signals: {
    active: Signal<Switch.Attrs["active"]>
    disabled: Signal<Switch.Attrs["disabled"]>
    label: Signal<Switch.Attrs["label"]>
    on_icon: Signal<Switch.Attrs["on_icon"]>
    off_icon: Signal<Switch.Attrs["off_icon"]>
  }

  override initialize(): void {
    super.initialize()

    this.signals = {
      active: signal(this.model.active),
      disabled: signal(this.model.disabled),
      label: signal(this.model.label),
      on_icon: signal(this.model.on_icon),
      off_icon: signal(this.model.off_icon),
    }
  }

  override render(): void {
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

    const stylesheets = [...this._stylesheets()]
      .map((sheet) => isString(sheet) ? new InlineStyleSheet(sheet) : sheet)
      .map((sheet) => sheet.to_native())

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

    const el = <ShadowSwitch></ShadowSwitch>
    render(el, this.el.parentNode!, this.el) // TODO preact-root-fragment
  }

  override readonly is_vdom = true
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
