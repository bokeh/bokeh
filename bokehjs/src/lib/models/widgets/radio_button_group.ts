import {ButtonGroup, ButtonGroupView} from "./button_group"

import * as p from "core/properties"
import * as buttons from "styles/buttons.css"

export class RadioButtonGroupView extends ButtonGroupView {
  override model: RadioButtonGroup

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

  export type Props = ButtonGroup.Props & {
    active: p.Property<number | null>
  }
}

export interface RadioButtonGroup extends RadioButtonGroup.Attrs {}

export class RadioButtonGroup extends ButtonGroup {
  override properties: RadioButtonGroup.Props
  override __view_type__: RadioButtonGroupView

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
