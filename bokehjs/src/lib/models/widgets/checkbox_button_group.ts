import {ToggleButtonGroup, ToggleButtonGroupView} from "./toggle_button_group"
import type * as p from "core/properties"

import {computed} from "@preact/signals"

export class CheckboxButtonGroupView extends ToggleButtonGroupView {
  declare model: CheckboxButtonGroup
  declare readonly signals: p.SignalsOf<CheckboxButtonGroup.Props>

  override active_indices = computed(() => {
    return new Set(this.signals.active.value)
  })

  change_active(i: number): void {
    const active = this.active_indices.value
    if (!active.delete(i)) {
      active.add(i)
    }
    this.model.active = [...active].sort()
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

  static {
    this.prototype.default_view = CheckboxButtonGroupView

    this.define<CheckboxButtonGroup.Props>(({Int, List}) => ({
      active: [ List(Int), [] ],
    }))
  }
}
