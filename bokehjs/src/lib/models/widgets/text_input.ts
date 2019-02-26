import {InputWidget, InputWidgetView} from "./input_widget"

import {input} from "core/dom"
import * as p from "core/properties"

export class TextInputView extends InputWidgetView {
  model: TextInput

  protected input_el: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input_el.name = this.model.name || "")
    this.connect(this.model.properties.value.change, () => this.input_el.value = this.model.value)
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input_el.placeholder = this.model.placeholder)
  }

  render(): void {
    super.render()

    this.input_el = input({
      type: "text",
      class: "bk-input",
      name: this.model.name,
      value: this.model.value,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
    })
    this.input_el.addEventListener("change", () => this.change_input())
    this.group_el.appendChild(this.input_el)
  }

  change_input(): void {
    this.model.value = this.input_el.value
    super.change_input()
  }
}

export namespace TextInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    placeholder: p.Property<string>
  }
}

export interface TextInput extends TextInput.Attrs {}

export class TextInput extends InputWidget {
  properties: TextInput.Props

  constructor(attrs?: Partial<TextInput.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TextInput"
    this.prototype.default_view = TextInputView

    this.define<TextInput.Props>({
      value:       [ p.String, "" ],
      placeholder: [ p.String, "" ],
    })
  }
}
TextInput.initClass()
