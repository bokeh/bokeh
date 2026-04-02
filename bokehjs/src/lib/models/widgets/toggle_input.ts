import {Widget, WidgetView} from "./widget"
import type {StyleSheetLike} from "core/dom"
import type * as p from "core/properties"
import * as toggle_input_css from "styles/widgets/toggle_input.css"

export abstract class ToggleInputView extends WidgetView {
  declare model: ToggleInput

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), toggle_input_css.default]
  }

  protected _toggle_active(): void {
    const {active, disabled, tri_state} = this.model
    const is_indeterminate = active === null
    if (!disabled) {
      this.model.active = !is_indeterminate && active ? !active : is_indeterminate || !tri_state ? true : null
    }
  }
}

export namespace ToggleInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    active: p.Property<boolean | null>
    label: p.Property<string>
    tri_state: p.Property<boolean>
  }
}

export interface ToggleInput extends ToggleInput.Attrs {}

export abstract class ToggleInput extends Widget {
  declare properties: ToggleInput.Props
  declare __view_type__: ToggleInputView

  constructor(attrs?: Partial<ToggleInput.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ToggleInput.Props>(({Bool, Nullable, Str}) => ({
      active: [ Nullable(Bool), false ],
      label: [ Str, "" ],
      // TODO: Implement tri-state handling without having to add this here
      tri_state: [ Bool, false],
    }))
  }
}
