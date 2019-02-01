import {InputWidget, InputWidgetView} from "./input_widget"

import {input} from "core/dom"
import * as p from "core/properties"

export class TextInputView extends InputWidgetView {
  model: TextInput

  protected input: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input.name = this.model.name || "")
    this.connect(this.model.properties.value.change, () => this.input.value = this.model.value)
    this.connect(this.model.properties.disabled.change, () => this.input.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input.placeholder = this.model.placeholder)
  }

  render(): void {
    super.render()

    this.input = input({
      type: "text",
      class: "bk-input",
      name: this.model.name,
      value: this.model.value,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
    })
    this.input.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.input)
  }

  change_input(): void {
    this.model.value = this.input.value
    super.change_input()
  }
}

export namespace TextInput {
  export interface Attrs extends InputWidget.Attrs {
    value: string
    placeholder: string
  }

  export interface Props extends InputWidget.Props {
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

    this.define({
      value:       [ p.String, "" ],
      placeholder: [ p.String, "" ],
    })
  }
}

TextInput.initClass()
