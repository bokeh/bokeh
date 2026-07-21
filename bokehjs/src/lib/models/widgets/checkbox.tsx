import {ToggleInput, ToggleInputView} from "./toggle_input"
import type {StyleSheetLike} from "core/stylesheets"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import checkbox_css from "styles/widgets/checkbox.css"
import * as toggle_css from "styles/widgets/toggle_input.css"

import type {VNode} from "preact"

export class CheckboxView extends ToggleInputView {
  declare readonly model: Checkbox
  declare readonly signals: p.SignalsOf<Checkbox.Props>
  declare readonly values: Checkbox.Attrs

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), checkbox_css]
  }

  override component(): VNode {
    const {label, disabled} = this.signals
    const {active} = this.values
    const active_value = active ?? false
    const aria_checked = active_value ? "true" : "false"

    return (
      <UIComponent parent={this.resolved_props} role="checkbox" aria-checked={aria_checked}>
        <input type="checkbox" checked={active_value} disabled={disabled} onChange={() => this._toggle_active()}></input>
        <div class={toggle_css.label}>{label}</div>
      </UIComponent>
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
