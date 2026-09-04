import {ToggleInputGroup, ToggleInputGroupView} from "./toggle_input_group"
import type {VNode} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import type * as p from "core/properties"
import * as inputs_css from "styles/widgets/inputs.css"

export class CheckboxGroupView extends ToggleInputGroupView {
  declare readonly model: CheckboxGroup
  declare readonly signals: p.SignalsOf<CheckboxGroup.Props>

  get indices(): Set<number> {
    return new Set(this.signals.active.value)
  }

  override component(): VNode {
    const {labels, disabled, inline} = this.signals
    const inline_cls = inline.value ? inputs_css.inline : null

    const {indices} = this
    const inputs = labels.value.map((label, i) => {
      const checked = indices.has(i)
      return (
        <label>
          <input type="checkbox" value={`${i}`} checked={checked} disabled={disabled} onChange={() => this.change_active(i)}></input>
          <span>{label}</span>
        </label>
      )
    })

    return (
      <UIComponent parent={this.resolved_props}>
        <div class={cls(inputs_css.input_group, inline_cls)}>
          {inputs}
        </div>
      </UIComponent>
    )
  }

  change_active(i: number): void {
    const {indices} = this
    if (!indices.delete(i)) {
      indices.add(i)
    }
    this.model.active = [...indices].sort()
  }
}

export namespace CheckboxGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ToggleInputGroup.Props & {
    active: p.Property<number[]>
  }
}

export interface CheckboxGroup extends CheckboxGroup.Attrs {}

export class CheckboxGroup extends ToggleInputGroup {
  declare properties: CheckboxGroup.Props
  declare __view_type__: CheckboxGroupView

  static {
    this.prototype.default_view = CheckboxGroupView

    this.define<CheckboxGroup.Props>(({Int, List}) => ({
      active: [ List(Int), [] ],
    }))
  }
}
