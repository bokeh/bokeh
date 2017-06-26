import {TextInput, TextInputView} from "./text_input"

export class PasswordInputView extends TextInputView
  render: () ->
    super()
    @inputEl.type = "password"

export class PasswordInput extends TextInput
  type: "PasswordInput"
  default_view: PasswordInputView
