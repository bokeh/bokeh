import {TextInput, TextInputView} from "./text_input"
import type {StyleSheetLike} from "core/dom"
import {div} from "core/dom"
import type * as p from "core/properties"
import password_input_css from "styles/widgets/password_input.css"
import icons_css from "styles/icons.css"

export class PasswordInputView extends TextInputView {
  declare model: PasswordInput

  toggle_el: HTMLElement

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), password_input_css, icons_css]
  }

  override render(): void {
    super.render()
    this.input_el.type = "password"

    this.toggle_el = div({class: "bk-toggle"})
    this.toggle_el.addEventListener("click", () => {
      const {input_el, toggle_el} = this
      const is_visible = input_el.type == "text"
      toggle_el.classList.toggle("bk-visible", !is_visible)
      input_el.type = is_visible ? "password" : "text"
    })
    this.shadow_el.append(this.toggle_el)
  }
}

export namespace PasswordInput {
  export type Attrs = p.AttrsOf<Props>
  export type Props = TextInput.Props
}

export interface PasswordInput extends PasswordInput.Attrs {}

export class PasswordInput extends TextInput {
  declare properties: PasswordInput.Props
  declare __view_type__: PasswordInputView

  constructor(attrs?: Partial<PasswordInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PasswordInputView
  }
}
