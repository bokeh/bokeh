import {input, label, div, span} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {InputGroup, InputGroupView} from "./input_group"

import * as inputs from "styles/widgets/inputs.css"

export class RadioGroupView extends InputGroupView {
  override model: RadioGroup

  override render(): void {
    super.render()

    const group = div({class: [inputs.input_group, this.model.inline ? inputs.inline : null]})
    this.shadow_el.appendChild(group)

    const name = uniqueId()
    const {active, labels} = this.model

    this._inputs = []
    for (let i = 0; i < labels.length; i++) {
      const radio = input({type: "radio", name, value: `${i}`})
      radio.addEventListener("change", () => this.change_active(i))
      this._inputs.push(radio)

      if (this.model.disabled)
        radio.disabled = true
      if (i == active)
        radio.checked = true

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

  export type Props = InputGroup.Props & {
    active: p.Property<number | null>
    labels: p.Property<string[]>
    inline: p.Property<boolean>
  }
}

export interface RadioGroup extends RadioGroup.Attrs {}

export class RadioGroup extends InputGroup {
  override properties: RadioGroup.Props
  override __view_type__: RadioGroupView

  constructor(attrs?: Partial<RadioGroup.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RadioGroupView

    this.define<RadioGroup.Props>(({Boolean, Int, String, Array, Nullable}) => ({
      active:   [ Nullable(Int), null ],
      labels:   [ Array(String), [] ],
      inline:   [ Boolean, false ],
    }))
  }
}
