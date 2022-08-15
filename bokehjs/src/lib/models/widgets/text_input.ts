import {TextLikeInput, TextLikeInputView} from "./text_like_input"

import {input, div} from "core/dom"
import * as p from "core/properties"

import * as inputs from "styles/widgets/inputs.css"

export class TextInputView extends TextLikeInputView {
  override model: TextInput

  override input_el: HTMLInputElement

  override connect_signals(): void {
    super.connect_signals()
    const {prefix, suffix} = this.model.properties
    this.on_change([prefix, suffix], () => this.render())
  }

  protected _render_input(): HTMLElement {
    this.input_el = input({type: "text", class: inputs.input})
    const {prefix, suffix} = this.model
    const prefix_el = prefix != null ? div({class: "bk-input-prefix"}, prefix) : null
    const suffix_el = suffix != null ? div({class: "bk-input-suffix"}, suffix) : null
    const container_el = div({class: "bk-input-container"}, prefix_el, this.input_el, suffix_el)
    return container_el
  }
}

export namespace TextInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextLikeInput.Props & {
    prefix: p.Property<string | null>
    suffix: p.Property<string | null>
  }
}

export interface TextInput extends TextInput.Attrs {}

export class TextInput extends TextLikeInput {
  override properties: TextInput.Props
  override __view_type__: TextInputView

  constructor(attrs?: Partial<TextInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextInputView

    this.define<TextInput.Props>(({String, Nullable}) => ({
      prefix: [ Nullable(String), null ],
      suffix: [ Nullable(String), null ],
    }))
  }
}
