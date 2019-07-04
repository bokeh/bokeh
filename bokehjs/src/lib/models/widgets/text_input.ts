import {InputWidget, InputWidgetView} from "./input_widget"

import {input} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

export class TextInputView extends InputWidgetView {
  model: TextInput

  protected input_el: HTMLInputElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.name.change, () => this.input_el.name = this.model.name || "")
    this.connect(this.model.properties.value.change, () => this.input_el.value = this.model.value)
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input_el.placeholder = this.model.placeholder)
    this.connect(this.model.properties.wait_commit.change, () => this.input_el.wait_commit = this.model.wait_commit)
  }

  render(): void {
    super.render()

    this.input_el = input({
      type: "text",
      class: bk_input,
      name: this.model.name,
      value: this.model.value,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
      wait_commit: this.model.wait_commit
    })
    if (this.model.wait_commit) {
        this.input_el.addEventListener("change", () => this.change_input())
    } else {
        this.input_el.addEventListener("input", () => this.change_input())
    }
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
    wait_commit: p.Property<boolean>
  }
}

export interface TextInput extends TextInput.Attrs {}

export class TextInput extends InputWidget {
  properties: TextInput.Props

  constructor(attrs?: Partial<TextInput.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = TextInputView

    this.define<TextInput.Props>({
      value:       [ p.String, "" ],
      placeholder: [ p.String, "" ],
      wait_commit:  [ p.Boolean, true ],
    })
  }
}
TextInput.initClass()
