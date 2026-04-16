import {InputWidget, InputWidgetView} from "./input_widget"
import type * as p from "core/properties"

export abstract class TextLikeInputView extends InputWidgetView {
  declare model: TextLikeInput

  declare input_el: HTMLInputElement | HTMLTextAreaElement

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.value.change, () => this.input_el.value = this.model.value)
    this.connect(this.model.properties.value_input.change, () => this.input_el.value = this.model.value_input)
    this.connect(this.model.properties.disabled.change, () => this.input_el.disabled = this.model.disabled)
    this.connect(this.model.properties.placeholder.change, () => this.input_el.placeholder = this.model.placeholder)
    this.connect(this.model.properties.max_length.change, () => {
      const {max_length} = this.model
      if (max_length != null) {
        this.input_el.maxLength = max_length
      } else {
        this.input_el.removeAttribute("maxLength")
      }
    })
  }

  override render(): void {
    super.render()

    const {input_el} = this
    input_el.value = this.model.value
    input_el.disabled = this.model.disabled
    input_el.placeholder = this.model.placeholder
    if (this.model.max_length != null) {
      input_el.maxLength = this.model.max_length
    }

    input_el.addEventListener("change", () => this.change_input())
    input_el.addEventListener("input",  () => this.change_input_value())
  }

  override change_input(): void {
    this.model.value = this.input_el.value
    super.change_input()
  }

  change_input_value(): void {
    this.model.value_input = this.input_el.value
    super.change_input()
  }
}

export namespace TextLikeInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    value_input: p.Property<string>
    placeholder: p.Property<string>
    max_length: p.Property<number | null>
  }
}

export interface TextLikeInput extends TextLikeInput.Attrs {}

export class TextLikeInput extends InputWidget {
  declare properties: TextLikeInput.Props
  declare __view_type__: TextLikeInputView

  constructor(attrs?: Partial<TextLikeInput.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TextLikeInput.Props>(({Int, Str, Nullable}) => ({
      value:       [ Str, "" ],
      value_input: [ Str, "" ],
      placeholder: [ Str, "" ],
      max_length:  [ Nullable(Int), null ],
    }))
  }
}
