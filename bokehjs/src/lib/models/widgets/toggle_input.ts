import {Widget, WidgetView} from "./widget"
import type * as p from "core/properties"

export abstract class ToggleInputView extends WidgetView {
  declare model: ToggleInput

  override connect_signals(): void {
    super.connect_signals()

    const {active, disabled} = this.model.properties
    this.on_change(active, () => this._update_active())
    this.on_change(disabled, () => this._update_disabled())
  }

  protected abstract _update_active(): void

  protected abstract _update_disabled(): void

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
    this.define<ToggleInput.Props>(({Bool}) => ({
      active: [ Bool, false ],
    }))
  }
}
