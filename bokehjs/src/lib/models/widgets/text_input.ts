import {TextLikeInput, TextLikeInputView} from "./text_like_input"

import {input, div} from "core/dom"
import type * as p from "core/properties"
import {ValueSubmit} from "core/bokeh_events"

import * as inputs from "styles/widgets/inputs.css"

export class TextInputView extends TextLikeInputView {
  declare model: TextInput

  declare input_el: HTMLInputElement

  override connect_signals(): void {
    super.connect_signals()
    const {prefix, suffix} = this.model.properties
    this.on_change([prefix, suffix], () => this.rerender())
  }

  protected _render_input(): HTMLElement {
    this.input_el = input({type: "text", class: inputs.input})
    const {prefix, suffix} = this.model
    const prefix_el = prefix != null ? div({class: "bk-input-prefix"}, prefix) : null
    const suffix_el = suffix != null ? div({class: "bk-input-suffix"}, suffix) : null
    const container_el = div({class: "bk-input-container"}, prefix_el, this.input_el, suffix_el)
    return container_el
  }

  override render(): void {
    super.render()
    this.input_el.addEventListener("keyup", (event) => this._keyup(event))
  }

  protected _keyup(event: KeyboardEvent): void {
    if (event.key == "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      this.model.trigger_event(new ValueSubmit(this.input_el.value))
    }
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
  declare properties: TextInput.Props
  declare __view_type__: TextInputView

  constructor(attrs?: Partial<TextInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextInputView

    this.define<TextInput.Props>(({Str, Nullable}) => ({
      prefix: [ Nullable(Str), null ],
      suffix: [ Nullable(Str), null ],
    }))
  }
}
