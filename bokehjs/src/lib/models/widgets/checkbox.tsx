import {ToggleInput, ToggleInputView} from "./toggle_input"
import type {StyleSheetLike} from "core/dom"
import {ShadowComponent, cls} from "core/vdom"
import type * as p from "core/properties"
import checkbox_css from "styles/widgets/checkbox.css"
import * as toggle_css from "styles/widgets/toggle_input.css"

import {render} from "preact"
import type {VNode} from "preact"
import {signal} from "@preact/signals"
import type {Signal} from "@preact/signals"

export class CheckboxView extends ToggleInputView {
  declare model: Checkbox

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), checkbox_css]
  }

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.change, () => {
      this.signals.active.value = this.model.active
      this.signals.label.value = this.model.label
      this.signals.disabled.value = this.model.disabled
      // Checkbox
      //   ----
      // ToggleInput
      //   active
      //   label
      // LayoutDOM
      //   disabled
      // Pane
      //  elements
      // UIElement
      //   visible
      //   context_menu
      // StyledElement
      //   html_attributes
      //   html_id
      //   css_classes
      //   css_variables
      //   styles
      //   stylesheets
    })
  }

  // TODO readonly; initialize in-place
  signals: {
    active: Signal<Checkbox.Attrs["active"]>
    label: Signal<Checkbox.Attrs["label"]>
    disabled: Signal<Checkbox.Attrs["disabled"]>
  }

  override initialize(): void {
    super.initialize()

    this.signals = {
      active: signal(this.model.active),
      label: signal(this.model.label),
      disabled: signal(this.model.disabled),
    }
  }

  component(): VNode {
    const classes = [...this._css_classes()]
    const stylesheets = this.adopted_stylesheets

    const {active, label, disabled} = this.signals
    return (
      <ShadowComponent stylesheets={stylesheets} class={cls(classes)} role="checkbox" aria-checked={active}>
        <input type="checkbox" checked={active} disabled={disabled} onChange={() => this._toggle_active()}></input>
        <div class={toggle_css.label}>{label}</div>
      </ShadowComponent>
    )
  }

  override render(): void {
    render(this.component(), this.el.parentNode!, this.el) // TODO preact-root-fragment
  }

  override readonly is_vdom = true
}

export namespace Checkbox {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ToggleInput.Props
}

export interface Checkbox extends Checkbox.Attrs {}

export class Checkbox extends ToggleInput {
  declare properties: Checkbox.Props
  declare __view_type__: CheckboxView

  constructor(attrs?: Partial<Checkbox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CheckboxView
  }
}
