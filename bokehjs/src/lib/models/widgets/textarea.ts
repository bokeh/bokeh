import {logger} from "core/logging"

import * as p from "core/properties"
import {empty, label, textarea} from "core/dom"

import {TextInput, TextInputView} from "./text_input"

export class TextAreaInputView extends TextInputView {
  model: TextAreaInput

  protected inputEl: HTMLTextAreaElement

  render(): void {
    super.render()

    empty(this.el)

    const labelEl = label({for: this.model.id}, this.model.title)
    this.el.appendChild(labelEl)

    this.inputEl = textarea({
      class: "bk-widget-form-textarea",
      id: this.model.id,
      name: this.model.name,
      disabled: this.model.disabled,
      placeholder: this.model.placeholder,
      cols: this.model.cols,
      rows: this.model.rows,
      maxLength: this.model.max_length,
    })
    this.inputEl.append(this.model.value)
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
  export interface Attrs extends TextInput.Attrs {
    cols: number
    rows: number
    max_length: number
  }
  export interface Props extends TextInput.Props {}
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

    this.define({
      cols:        [ p.Number, 20],
      rows:        [ p.Number, 2],
      max_length:  [ p.Number, 500],
    })
  }
}

TextAreaInput.initClass()
