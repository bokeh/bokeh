import {TextInput} from "./text_input"
import {InputWidgetView} from "./input_widget"

import {textarea} from "core/dom"
import * as p from "core/properties"

export class TextAreaInputView extends InputWidgetView {
  model: TextAreaInput

  protected input: HTMLTextAreaElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input.name = this.model.name || "")
    this.connect(this.model.properties.value.change, () => this.input.value = this.model.value)
    this.connect(this.model.properties.disabled.change, () => this.input.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input.placeholder = this.model.placeholder)
    this.connect(this.model.properties.rows.change, () => this.input.rows = this.model.rows)
    this.connect(this.model.properties.cols.change, () => this.input.cols = this.model.cols)
    this.connect(this.model.properties.max_length.change, () => this.input.maxLength = this.model.max_length)
  }

  render(): void {
    super.render()

    this.input = textarea({
      class: "bk-input",
      name: this.model.name,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
      cols: this.model.cols,
      rows: this.model.rows,
      maxLength: this.model.max_length,
    })
    this.input.textContent = this.model.value
    this.input.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.input)
  }

  change_input(): void {
    this.model.value = this.input.value
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

  static initClass(): void {
    this.prototype.type = "TextAreaInput"
    this.prototype.default_view = TextAreaInputView

    this.define<TextAreaInput.Props>({
      cols:       [ p.Number, 20  ],
      rows:       [ p.Number, 2   ],
      max_length: [ p.Number, 500 ],
    })
  }
}
TextAreaInput.initClass()
