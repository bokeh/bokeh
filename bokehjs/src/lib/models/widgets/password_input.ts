import {TextInput, TextInputView} from "./text_input"
import * as p from "core/properties"

export class PasswordInputView extends TextInputView {
  model: PasswordInput

  render(): void {
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
  properties: PasswordInput.Props

  constructor(attrs?: Partial<PasswordInput.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PasswordInput"
    this.prototype.default_view = PasswordInputView
  }
}
PasswordInput.initClass()
