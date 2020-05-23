import {ButtonGroup, ButtonGroupView} from "./button_group"

import {classes} from "core/dom"
import * as p from "core/properties"

import {bk_active} from "styles/mixins"

export class CheckboxButtonGroupView extends ButtonGroupView {
  model: CheckboxButtonGroup

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

    this._buttons.forEach((button, i) => {
      classes(button).toggle(bk_active, active.has(i))
    })
  }
}

export namespace CheckboxButtonGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ButtonGroup.Props & {
    active: p.Property<number[]>
  }
}

export interface CheckboxButtonGroup extends CheckboxButtonGroup.Attrs {}

export class CheckboxButtonGroup extends ButtonGroup {
  properties: CheckboxButtonGroup.Props
  __view_type__: CheckboxButtonGroupView

  constructor(attrs?: Partial<CheckboxButtonGroup.Attrs>) {
    super(attrs)
  }

  static init_CheckboxButtonGroup(): void {
    this.prototype.default_view = CheckboxButtonGroupView

    this.define<CheckboxButtonGroup.Props>({
      active: [ p.Array, [] ],
    })
  }
}
