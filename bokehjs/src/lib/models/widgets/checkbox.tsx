import {ToggleInput, ToggleInputView} from "./toggle_input"
import type {StyleSheetLike} from "core/stylesheets"
import {ShadowComponent, cls} from "core/vdom"
import type * as p from "core/properties"
import checkbox_css from "styles/widgets/checkbox.css"
import * as toggle_css from "styles/widgets/toggle_input.css"

import type {VNode} from "preact"

export class CheckboxView extends ToggleInputView {
  declare readonly model: Checkbox
  declare readonly signals: p.SignalsOf<Checkbox.Props>

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), checkbox_css]
  }

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
  override component(): VNode {
    const classes = [...this._css_classes()]
    const stylesheets = this.resolved_stylesheets

    const {active, label, disabled} = this.signals
    return (
      <ShadowComponent stylesheets={stylesheets} class={cls(classes)} role="checkbox" aria-checked={active}>
        <input type="checkbox" checked={active} disabled={disabled} onChange={() => this._toggle_active()}></input>
        <div class={toggle_css.label}>{label}</div>
      </ShadowComponent>
    )
  }
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
