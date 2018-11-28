import {logger} from "core/logging"
import * as p from "core/properties"
import {empty, label, textarea} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"

export class TextAreaInputView extends InputWidgetView {
  model: TextAreaInput

  protected inputEl: HTMLTextAreaElement

  initialize(options: any): void {
    super.initialize(options)
    this.render()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-widget-form-group")
  }

  render(): void {
    super.render()

    empty(this.el)

    const labelEl = label({for: this.model.id}, this.model.title)
    this.el.appendChild(labelEl)

    this.inputEl = textarea({
      class: "bk-widget-form-textarea",
      id: this.model.id,
      name: this.model.name,
      value: this.model.value,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
      cols: this.model.cols,
      rows: this.model.rows,
      maxLength: this.model.max_length,
    })
    this.inputEl.addEventListener("change", () => this.change_input())
    this.el.appendChild(this.inputEl)

    // TODO - This 35 is a hack we should be able to compute it
    if (this.model.height)
      this.inputEl.style.height = `${this.model.height - 35}px`
  }
  change_input(): void {
    const value = this.inputEl.value
    logger.debug(`widget/text_input: value = ${value}`)
    this.model.value = value
    super.change_input()
  }
}

export namespace TextAreaInput {
  export interface Attrs extends InputWidget.Attrs {
    value: string
    placeholder: string
    cols: number
    rows: number
    max_length: number
  }
  export interface Props extends InputWidget.Props {}
}

export interface TextAreaInput extends TextAreaInput.Attrs {}

export class TextAreaInput extends InputWidget {

  properties: TextAreaInput.Props

  constructor(attrs?: Partial<TextAreaInput.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TextAreaInput"
    this.prototype.default_view = TextAreaInputView

    this.define({
      value:       [ p.String, "" ],
      placeholder: [ p.String, "" ],
      cols:        [ p.Number, 200],
      rows:        [ p.Number, 5],
      max_length:  [ p.Number, 1000],
    })
  }
}

TextAreaInput.initClass()
