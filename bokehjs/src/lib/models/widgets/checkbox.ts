import {ToggleInput, ToggleInputView} from "./toggle_input"
import type {StyleSheetLike} from "core/dom"
import {input} from "core/dom"
import type * as p from "core/properties"
import checkbox_css from "styles/widgets/checkbox.css"

export class CheckboxView extends ToggleInputView {
  declare model: Checkbox

  protected checkbox_el: HTMLInputElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), checkbox_css]
  }

  override render(): void {
    super.render()
    this.checkbox_el = input({type: "checkbox"})
    this.checkbox_el.addEventListener("change", () => this._toggle_active())
    this._update_label()
    this._update_active()
    this._update_disabled()
    this.shadow_el.append(this.checkbox_el, this.label_el)
  }

  protected _update_active(): void {
    this.checkbox_el.checked = this.model.active
  }

  protected _update_disabled(): void {
    this.checkbox_el.toggleAttribute("disabled", this.model.disabled)
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
