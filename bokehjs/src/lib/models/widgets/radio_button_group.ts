import {ToggleButtonGroup, ToggleButtonGroupView} from "./toggle_button_group"

import type * as p from "core/properties"
import * as buttons from "styles/buttons.css"

export class RadioButtonGroupView extends ToggleButtonGroupView {
  declare model: RadioButtonGroup

  change_active(i: number): void {
    if (this.model.active !== i) {
      this.model.active = i
    }
  }

  protected _update_active(): void {
    const {active} = this.model

    this._buttons.forEach((button_el, i) => {
      button_el.classList.toggle(buttons.active, active === i)
    })
  }
}

export namespace RadioButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ToggleButtonGroup.Props & {
    active: p.Property<number | null>
  }
}

export interface RadioButtonGroup extends RadioButtonGroup.Attrs {}

export class RadioButtonGroup extends ToggleButtonGroup {
  declare properties: RadioButtonGroup.Props
  declare __view_type__: RadioButtonGroupView

  constructor(attrs?: Partial<RadioButtonGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RadioButtonGroupView

    this.define<RadioButtonGroup.Props>(({Int, Nullable}) => ({
      active: [ Nullable(Int), null ],
    }))
  }
}
