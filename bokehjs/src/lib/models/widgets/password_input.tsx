import {TextInput, TextInputView} from "./text_input"
import type {StyleSheetLike} from "core/stylesheets"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import * as password_input_css from "styles/widgets/password_input.css"
import * as inputs_css from "styles/widgets/inputs.css"

import {signal} from "@preact/signals"

export class PasswordInputView extends TextInputView {
  declare readonly model: PasswordInput
  declare readonly signals: p.SignalsOf<PasswordInput.Props>
  declare readonly values: PasswordInput.Attrs

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), password_input_css.default]
  }

  readonly unprotected = signal(false)

  protected _toggle_click(): void {
    this.unprotected.value = !this.unprotected.value
  }

  override component(): VNode {
    const {disabled, value, placeholder} = this.signals
    const {max_length, prefix, suffix} = this.values
    const unprotected = this.unprotected.value
    const Title = this._title_el.bind(this)
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div class={inputs_css.outer}>
          {prefix != null ? <div class={inputs_css.prefix}>{prefix}</div> : null}
          <div class={inputs_css.inner}>
            <input
              type={unprotected ? "text" : "password"}
              class={inputs_css.input}
              disabled={disabled}
              value={value}
              placeholder={placeholder}
              maxLength={max_length ?? undefined}
              onKeyUp={this._key_up.bind(this)}
              onChange={(event) => this.model.value = event.currentTarget.value}
              onInput={(event) => this.model.value_input = event.currentTarget.value}
            />
            <button type="button" class={password_input_css.toggle} onClick={this._toggle_click.bind(this)}>
              <div class={password_input_css.icon}></div>
            </button>
          </div>
          {suffix != null ? <div class={inputs_css.suffix}>{suffix}</div> : null}
        </div>
      </UIComponent>
    )
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
