import {TextLikeInput, TextLikeInputView} from "./text_like_input"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import {ValueSubmit} from "core/bokeh_events"
import * as inputs_css from "styles/widgets/inputs.css"

import type {TargetedKeyboardEvent} from "preact"

export class TextInputView extends TextLikeInputView {
  declare readonly model: TextInput
  declare readonly signals: p.SignalsOf<TextInput.Props>

  override component(): VNode {
    const {disabled, value, placeholder} = this.signals
    const max_length = this.signals.max_length.value
    const prefix = this.signals.prefix.value
    const suffix = this.signals.suffix.value
    const Title = this._title_el.bind(this)
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div class={inputs_css.outer}>
          {prefix != null ? <div class={inputs_css.prefix}>{prefix}</div> : null}
          <div class={inputs_css.inner}>
            <input
              type="text"
              class={inputs_css.input}
              disabled={disabled}
              value={value}
              placeholder={placeholder}
              maxLength={max_length ?? undefined}
              onKeyUp={this._key_up.bind(this)}
              onChange={(event) => this.model.value = event.currentTarget.value}
              onInput={(event) => this.model.value_input = event.currentTarget.value}
            />
          </div>
          {suffix != null ? <div class={inputs_css.suffix}>{suffix}</div> : null}
        </div>
      </UIComponent>
    )
  }

  protected _key_up(event: TargetedKeyboardEvent<HTMLInputElement>): void {
    if (event.key == "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      this.model.trigger_event(new ValueSubmit(event.currentTarget.value))
    }
  }
}

export namespace TextInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextLikeInput.Props & {
    prefix: p.Property<string | null>
    suffix: p.Property<string | null>
  }
}

export interface TextInput extends TextInput.Attrs {}

export class TextInput extends TextLikeInput {
  declare properties: TextInput.Props
  declare __view_type__: TextInputView

  constructor(attrs?: Partial<TextInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextInputView

    this.define<TextInput.Props>(({Str, Nullable}) => ({
      prefix: [ Nullable(Str), null ],
      suffix: [ Nullable(Str), null ],
    }))
  }
}
