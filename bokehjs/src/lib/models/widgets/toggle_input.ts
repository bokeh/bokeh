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
    if (!this.model.disabled) {
      this.model.active = !this.model.active
    }
  }
}

export namespace ToggleInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    active: p.Property<boolean>
    label: p.Property<string>
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
    this.define<ToggleInput.Props>(({Bool, Str}) => ({
      active: [ Bool, false ],
      label: [ Str, "" ],
    }))
  }
}
