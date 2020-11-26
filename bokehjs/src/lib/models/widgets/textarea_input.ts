import {TextLikeInput, TextLikeInputView} from "./text_like_input"

import {textarea} from "core/dom"
import * as p from "core/properties"

import * as inputs from "styles/widgets/inputs.css"

export class TextAreaInputView extends TextLikeInputView {
  model: TextAreaInput

  protected input_el: HTMLTextAreaElement

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.rows.change, () => this.input_el.rows = this.model.rows)
    this.connect(this.model.properties.cols.change, () => this.input_el.cols = this.model.cols)
  }
  protected _render_input(): void {
    this.input_el = textarea({class: inputs.input})
  }

  render(): void {
    super.render()
    this.input_el.cols = this.model.cols
    this.input_el.rows = this.model.rows
  }
}

export namespace TextAreaInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextLikeInput.Props & {
    cols: p.Property<number>
    rows: p.Property<number>
  }
}

export interface TextAreaInput extends TextAreaInput.Attrs {}

export class TextAreaInput extends TextLikeInput {
  properties: TextAreaInput.Props
  __view_type__: TextAreaInputView

  constructor(attrs?: Partial<TextAreaInput.Attrs>) {
    super(attrs)
  }

  static init_TextAreaInput(): void {
    this.prototype.default_view = TextAreaInputView

    this.define<TextAreaInput.Props>(({Int}) => ({
      cols: [ Int, 20 ],
      rows: [ Int, 2 ],
    }))

    this.override<TextAreaInput.Props>({
      max_length: 500,
    })
  }
}
