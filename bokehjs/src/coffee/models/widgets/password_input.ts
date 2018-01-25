/* XXX: partial */
import {TextInput, TextInputView} from "./text_input"

export class PasswordInputView extends TextInputView {
  model: PasswordInput

  render(): void {
    super.render()
    this.inputEl.type = "password"
  }
}

export namespace PasswordInput {
  export interface Attrs extends TextInput.Attrs {}
}

export interface PasswordInput extends TextInput, PasswordInput.Attrs {}

export class PasswordInput extends TextInput {

  static initClass() {
    this.prototype.type = "PasswordInput"
    this.prototype.default_view = PasswordInputView
  }
}

PasswordInput.initClass()
