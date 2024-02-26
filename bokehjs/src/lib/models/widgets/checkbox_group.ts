import {ToggleInputGroup, ToggleInputGroupView} from "./toggle_input_group"
import {input, label, div, span} from "core/dom"
import {includes} from "core/util/array"
import {enumerate} from "core/util/iterator"
import type * as p from "core/properties"
import * as inputs from "styles/widgets/inputs.css"

export class CheckboxGroupView extends ToggleInputGroupView {
  declare model: CheckboxGroup

  get active(): Set<number> {
    return new Set(this.model.active)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {active} = this.model.properties
    this.on_change(active, () => {
      const {active} = this
      for (const [input_el, i] of enumerate(this._inputs)) {
        input_el.checked = active.has(i)
      }
    })
  }

  override render(): void {
    super.render()

    const group = div({class: [inputs.input_group, this.model.inline ? inputs.inline : null]})
    this.shadow_el.appendChild(group)

    const {active, labels} = this.model

    this._inputs = []
    for (let i = 0; i < labels.length; i++) {
      const checkbox = input({type: "checkbox", value: `${i}`})
      checkbox.addEventListener("change", () => this.change_active(i))
      this._inputs.push(checkbox)

      if (this.model.disabled) {
        checkbox.disabled = true
      }

      if (includes(active, i)) {
        checkbox.checked = true
      }

      const label_el = label(checkbox, span(labels[i]))
      group.appendChild(label_el)
    }
  }

  change_active(i: number): void {
    const {active} = this
    active.has(i) ? active.delete(i) : active.add(i)
    this.model.active = [...active].sort()
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

  constructor(attrs?: Partial<CheckboxGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CheckboxGroupView

    this.define<CheckboxGroup.Props>(({Int, List}) => ({
      active: [ List(Int), [] ],
    }))
  }
}
