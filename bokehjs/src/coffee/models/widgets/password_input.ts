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

  export interface Opts extends TextInput.Opts {}
}

export interface PasswordInput extends PasswordInput.Attrs {}

export class PasswordInput extends TextInput {

  constructor(attrs?: Partial<PasswordInput.Attrs>, opts?: PasswordInput.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "PasswordInput"
    this.prototype.default_view = PasswordInputView
  }
}

PasswordInput.initClass()
