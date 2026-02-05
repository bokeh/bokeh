import {ToggleInputGroup, ToggleInputGroupView} from "./toggle_input_group"
import type {VNode} from "core/vdom"
import {ShadowComponent, cls} from "core/vdom"
import {unique_id} from "core/util/string"
import type * as p from "core/properties"
import * as inputs_css from "styles/widgets/inputs.css"

export class RadioGroupView extends ToggleInputGroupView {
  declare readonly model: RadioGroup
  declare readonly signals: p.SignalsOf<RadioGroup.Props>

  override component(): VNode {
    const classes = [...this._css_classes()]
    const stylesheets = this.resolved_stylesheets

    const {labels, active, disabled, inline} = this.signals
    const inline_cls = inline.value ? inputs_css.inline : null

    const name = unique_id()
    const inputs = labels.value.map((label, i) => {
      const checked = active.value == i
      return (
        <label>
          <input type="radio" name={name} value={`${i}`} checked={checked} disabled={disabled} onChange={() => this.change_active(i)}></input>
          <span>{label}</span>
        </label>
      )
    })

    return (
      <ShadowComponent stylesheets={stylesheets} class={cls(classes)}>
        <div class={cls(inputs_css.input_group, inline_cls)}>
          {inputs}
        </div>
      </ShadowComponent>
    )
  }

  change_active(i: number): void {
    this.model.active = i
  }
}

export namespace RadioGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ToggleInputGroup.Props & {
    active: p.Property<number | null>
  }
}

export interface RadioGroup extends RadioGroup.Attrs {}

export class RadioGroup extends ToggleInputGroup {
  declare properties: RadioGroup.Props
  declare __view_type__: RadioGroupView

  constructor(attrs?: Partial<RadioGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RadioGroupView

    this.define<RadioGroup.Props>(({Int, Nullable}) => ({
      active: [ Nullable(Int), null ],
    }))
  }
}
