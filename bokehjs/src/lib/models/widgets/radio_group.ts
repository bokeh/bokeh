import {input, label, div, span} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {InputGroup, InputGroupView} from "./input_group"
import {CallbackLike0} from "../callbacks/callback"

import {bk_inline} from "styles/mixins"
import {bk_input_group} from "styles/widgets/inputs"

export class RadioGroupView extends InputGroupView {
  model: RadioGroup

  render(): void {
    super.render()

    const group = div({class: [bk_input_group, this.model.inline ? bk_inline : null]})
    this.el.appendChild(group)

    const name = uniqueId()
    const {active, labels} = this.model

    for (let i = 0; i < labels.length; i++) {
      const radio = input({type: `radio`, name, value: `${i}`})
      radio.addEventListener("change", () => this.change_active(i))

      if (this.model.disabled)
        radio.disabled = true
      if (i == active)
        radio.checked = true

      const label_el = label({}, radio, span({}, labels[i]))
      group.appendChild(label_el)
    }
  }

  change_active(i: number): void {
    this.model.active = i
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace RadioGroup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputGroup.Props & {
    active: p.Property<number>
    labels: p.Property<string[]>
    inline: p.Property<boolean>
    callback: p.Property<CallbackLike0<RadioGroup> | null>
  }
}

export interface RadioGroup extends RadioGroup.Attrs {}

export class RadioGroup extends InputGroup {
  properties: RadioGroup.Props

  constructor(attrs?: Partial<RadioGroup.Attrs>) {
    super(attrs)
  }

  static init_RadioGroup(): void {
    this.prototype.default_view = RadioGroupView

    this.define<RadioGroup.Props>({
      active:   [ p.Number         ],
      labels:   [ p.Array,   []    ],
      inline:   [ p.Boolean, false ],
      callback: [ p.Any            ],
    })
  }
}
