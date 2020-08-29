import {ButtonGroup, ButtonGroupView} from "./button_group"

import {classes} from "core/dom"
import * as p from "core/properties"

import {bk_active} from "styles/mixins"

export class RadioButtonGroupView extends ButtonGroupView {
  model: RadioButtonGroup

  change_active(i: number): void {
    if (this.model.active !== i) {
      this.model.active = i
    }
  }

  protected _update_active(): void {
    const {active} = this.model

    this._buttons.forEach((button, i) => {
      classes(button).toggle(bk_active, active === i)
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
  properties: RadioButtonGroup.Props
  __view_type__: RadioButtonGroupView

  constructor(attrs?: Partial<RadioButtonGroup.Attrs>) {
    super(attrs)
  }

  static init_RadioButtonGroup(): void {
    this.prototype.default_view = RadioButtonGroupView

    this.define<RadioButtonGroup.Props>(({Int, Nullable}) => ({
      active: [ Nullable(Int), null ],
    }))
  }
}
