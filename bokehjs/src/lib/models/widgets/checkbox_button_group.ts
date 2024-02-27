import {ToggleButtonGroup, ToggleButtonGroupView} from "./toggle_button_group"

import type * as p from "core/properties"
import * as buttons from "styles/buttons.css"

export class CheckboxButtonGroupView extends ToggleButtonGroupView {
  declare model: CheckboxButtonGroup

  get active(): Set<number> {
    return new Set(this.model.active)
  }

  change_active(i: number): void {
    const {active} = this
    active.has(i) ? active.delete(i) : active.add(i)
    this.model.active = [...active].sort()
  }

  protected _update_active(): void {
    const {active} = this

    this._buttons.forEach((button_el, i) => {
      button_el.classList.toggle(buttons.active, active.has(i))
    })
  }
}

export namespace CheckboxButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ToggleButtonGroup.Props & {
    active: p.Property<number[]>
  }
}

export interface CheckboxButtonGroup extends CheckboxButtonGroup.Attrs {}

export class CheckboxButtonGroup extends ToggleButtonGroup {
  declare properties: CheckboxButtonGroup.Props
  declare __view_type__: CheckboxButtonGroupView

  constructor(attrs?: Partial<CheckboxButtonGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CheckboxButtonGroupView

    this.define<CheckboxButtonGroup.Props>(({Int, List}) => ({
      active: [ List(Int), [] ],
    }))
  }
}
