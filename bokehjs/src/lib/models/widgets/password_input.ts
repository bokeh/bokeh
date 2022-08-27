import {TextInput, TextInputView} from "./text_input"
import {div, StyleSheetLike} from "core/dom"
import * as p from "core/properties"
import password_input_css from "styles/widgets/password_input.css"
import icons_css from "styles/icons.css"

export class PasswordInputView extends TextInputView {
  override model: PasswordInput

  toggle_el: HTMLElement

  override styles(): StyleSheetLike[] {
    return [...super.styles(), password_input_css, icons_css]
  }

  override render(): void {
    super.render()
    this.input_el.type = "password"

    this.toggle_el = div({class: "bk-toggle"})
    this.toggle_el.addEventListener("click", () => {
      const {input_el} = this
      input_el.type = input_el.type == "password" ? "text" : "password"
    })
    this.input_el.after(this.toggle_el)
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

  static {
    this.prototype.default_view = PasswordInputView
  }
}
