import {InputGroup, InputGroupView} from "./input_group"

import {input, label, div, span} from "core/dom"
import {includes} from "core/util/array"
import * as p from "core/properties"

import {bk_inline} from "styles/mixins"
import {bk_input_group} from "styles/widgets/inputs"

export class CheckboxGroupView extends InputGroupView {
  model: CheckboxGroup

  render(): void {
    super.render()

    const group = div({class: [bk_input_group, this.model.inline ? bk_inline : null]})
    this.el.appendChild(group)

    const {active, labels} = this.model

    this._inputs = []
    for (let i = 0; i < labels.length; i++) {
      const checkbox = input({type: `checkbox`, value: `${i}`})
      checkbox.addEventListener("change", () => this.change_active(i))
      this._inputs.push(checkbox)

      if (this.model.disabled)
        checkbox.disabled = true

      if (includes(active, i))
        checkbox.checked = true

      const label_el = label({}, checkbox, span({}, labels[i]))
      group.appendChild(label_el)
    }
  }

  change_active(i: number): void {
    const active = new Set(this.model.active)
    active.has(i) ? active.delete(i) : active.add(i)
    this.model.active = [...active].sort()
  }
}

export namespace CheckboxGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputGroup.Props & {
    active: p.Property<number[]>
    labels: p.Property<string[]>
    inline: p.Property<boolean>
  }
}

export interface CheckboxGroup extends CheckboxGroup.Attrs {}

export class CheckboxGroup extends InputGroup {
  properties: CheckboxGroup.Props
  __view_type__: CheckboxGroupView

  constructor(attrs?: Partial<CheckboxGroup.Attrs>) {
    super(attrs)
  }

  static init_CheckboxGroup(): void {
    this.prototype.default_view = CheckboxGroupView

    this.define<CheckboxGroup.Props>({
      active:   [ p.Array,   []    ],
      labels:   [ p.Array,   []    ],
      inline:   [ p.Boolean, false ],
    })
  }
}
