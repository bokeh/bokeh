import {TextLikeInput, TextLikeInputView} from "./text_like_input"

import {input} from "core/dom"
import * as p from "core/properties"

import {bk_input} from "styles/widgets/inputs"

export class TextInputView extends TextLikeInputView {
  model: TextInput

  protected input_el: HTMLInputElement

  protected _render_input(): void {
    this.input_el = input({type: "text", class: bk_input})
  }
}

export namespace TextInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextLikeInput.Props
}

export interface TextInput extends TextInput.Attrs {}

export class TextInput extends TextLikeInput {
  properties: TextInput.Props
  __view_type__: TextInputView

  constructor(attrs?: Partial<TextInput.Attrs>) {
    super(attrs)
  }

  static init_TextInput(): void {
    this.prototype.default_view = TextInputView
  }
}
