import {ButtonGroup, ButtonGroupView} from "./button_group"

import {Class} from "core/class"
import {Set} from "core/util/data_structures"
import * as p from "core/properties"

export class CheckboxButtonGroupView extends ButtonGroupView {
  model: CheckboxButtonGroup

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => this._update_active())
  }

  get active(): Set<number> {
    return new Set(this.model.active)
  }

  change_active(i: number): void {
    const {active} = this
    active.toggle(i)
    this.model.active = active.values

    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }

  protected _update_active(): void {
    const {active} = this

    this._buttons.forEach((button, i) => {
      if (active.has(i))
        button.classList.add("bk-active")
      else
        button.classList.remove("bk-active")
    })
  }
}

export namespace CheckboxButtonGroup {
  export interface Attrs extends ButtonGroup.Attrs {
    active: number[]
  }

  export interface Props extends ButtonGroup.Props {
    active: p.Property<number[]>
  }
}

export interface CheckboxButtonGroup extends CheckboxButtonGroup.Attrs {}

export class CheckboxButtonGroup extends ButtonGroup {
  properties: CheckboxButtonGroup.Props
  default_view: Class<CheckboxButtonGroupView>

  constructor(attrs?: Partial<CheckboxButtonGroup.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CheckboxButtonGroup"
    this.prototype.default_view = CheckboxButtonGroupView

    this.define({
      active: [ p.Array, [] ],
    })
  }
}
CheckboxButtonGroup.initClass()
