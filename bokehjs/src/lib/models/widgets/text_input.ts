import {logger} from "core/logging"
import * as p from "core/properties"
import {label, input} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"

export class BaseTextInputView extends InputWidgetView {
  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }
}

export class TextInputView extends BaseTextInputView {
  model: TextInput

  protected inputEl: HTMLInputElement

  render(): void {
    super.render()

    if (this.model.title.length > 0) {
      const labelEl = label({for: this.model.id}, this.model.title)
      this.el.appendChild(labelEl)
    }

    this.inputEl = input({
      type: "text",
      class: "bk-input",
      id: this.model.id,
      name: this.model.name,
      value: this.model.value,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
    })
    this.inputEl.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.inputEl)
  }

  change_input(): void {
    const value = this.inputEl.value
    logger.debug(`widget/text_input: value = ${value}`)
    this.model.value = value
    super.change_input()
  }
}

export namespace TextInput {
  export interface Attrs extends InputWidget.Attrs {
    value: string
    placeholder: string
  }

  export interface Props extends InputWidget.Props {}
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
