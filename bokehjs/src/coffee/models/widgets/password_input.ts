/* XXX: partial */
import {TextInput, TextInputView} from "./text_input"

export class PasswordInputView extends TextInputView {
  model: PasswordInput

  render(): void {
    super.render()
    this.inputEl.type = "password"
  }
}

export class PasswordInput extends TextInput {
}

PasswordInput.prototype.type = "PasswordInput"
PasswordInput.prototype.default_view = PasswordInputView
