import {TextInput, TextInputView} from "./text_input"
import * as p from "core/properties"

export class PasswordInputView extends TextInputView {
  override model: PasswordInput

  override render(): void {
    super.render()
    this.input_el.type = "password"
  }
}

export namespace PasswordInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextInput.Props
}

export interface PasswordInput extends PasswordInput.Attrs {}

export class PasswordInput extends TextInput {
  override properties: PasswordInput.Props
  override __view_type__: PasswordInputView

  constructor(attrs?: Partial<PasswordInput.Attrs>) {
    super(attrs)
  }

  static init_PasswordInput(): void {
    this.prototype.default_view = PasswordInputView
  }
}
