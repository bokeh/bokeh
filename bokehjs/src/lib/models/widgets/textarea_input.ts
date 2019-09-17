import {TextInput} from "./text_input"
import {InputWidgetView} from "./input_widget"

import {textarea} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

export class TextAreaInputView extends InputWidgetView {
  model: TextAreaInput

  protected input_el: HTMLTextAreaElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input_el.name = this.model.name || "")
    this.connect(this.model.properties.value.change, () => this.input_el.value = this.model.value)
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input_el.placeholder = this.model.placeholder)
    this.connect(this.model.properties.rows.change, () => this.input_el.rows = this.model.rows)
    this.connect(this.model.properties.cols.change, () => this.input_el.cols = this.model.cols)
    this.connect(this.model.properties.max_length.change, () => this.input_el.maxLength = this.model.max_length)
  }

  render(): void {
    super.render()

    this.input_el = textarea({
      class: bk_input,
      name: this.model.name,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
      cols: this.model.cols,
      rows: this.model.rows,
      maxLength: this.model.max_length,
    })
    this.input_el.textContent = this.model.value
    this.input_el.addEventListener("change", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    this.model.value = this.input_el.value
    super.change_input()
  }
}

export namespace TextAreaInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextInput.Props & {
    cols: p.Property<number>
    rows: p.Property<number>
    max_length: p.Property<number>
  }
}

export interface TextAreaInput extends TextAreaInput.Attrs {}

export class TextAreaInput extends TextInput {
  properties: TextAreaInput.Props

  constructor(attrs?: Partial<TextAreaInput.Attrs>) {
    super(attrs)
  }

  static init_TextAreaInput(): void {
    this.prototype.default_view = TextAreaInputView

    this.define<TextAreaInput.Props>({
      cols:       [ p.Number, 20  ],
      rows:       [ p.Number, 2   ],
      max_length: [ p.Number, 500 ],
    })
  }
}
