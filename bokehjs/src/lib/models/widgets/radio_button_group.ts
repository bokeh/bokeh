import {ToggleButtonGroup, ToggleButtonGroupView} from "./toggle_button_group"
import type * as p from "core/properties"

import {computed} from "@preact/signals"

export class RadioButtonGroupView extends ToggleButtonGroupView {
  declare model: RadioButtonGroup
  declare readonly signals: p.SignalsOf<RadioButtonGroup.Props>

  override active_indices = computed(() => {
    const active = this.signals.active.value
    return new Set(active == null ? [] : [active])
  })

  change_active(i: number): void {
    this.model.active = i
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

  protected constructor(attrs?: Partial<RadioButtonGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RadioButtonGroupView

    this.define<RadioButtonGroup.Props>(({Int, Nullable}) => ({
      active: [ Nullable(Int), null ],
    }))
  }
}
