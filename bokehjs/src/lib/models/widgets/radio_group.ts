import {ToggleInputGroup, ToggleInputGroupView} from "./toggle_input_group"
import {input, label, div, span} from "core/dom"
import {unique_id} from "core/util/string"
import {enumerate} from "core/util/iterator"
import type * as p from "core/properties"
import * as inputs from "styles/widgets/inputs.css"

export class RadioGroupView extends ToggleInputGroupView {
  declare model: RadioGroup

  override connect_signals(): void {
    super.connect_signals()

    const {active} = this.model.properties
    this.on_change(active, () => {
      const {active} = this.model
      for (const [input_el, i] of enumerate(this._inputs)) {
        input_el.checked = active == i
      }
    })
  }

  override render(): void {
    super.render()

    const group = div({class: [inputs.input_group, this.model.inline ? inputs.inline : null]})
    this.shadow_el.appendChild(group)

    const name = unique_id()
    const {active, labels} = this.model

    this._inputs = []
    for (let i = 0; i < labels.length; i++) {
      const radio = input({type: "radio", name, value: `${i}`})
      radio.addEventListener("change", () => this.change_active(i))
      this._inputs.push(radio)

      if (this.model.disabled) {
        radio.disabled = true
      }
      if (i == active) {
        radio.checked = true
      }

      const label_el = label(radio, span(labels[i]))
      group.appendChild(label_el)
    }
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
