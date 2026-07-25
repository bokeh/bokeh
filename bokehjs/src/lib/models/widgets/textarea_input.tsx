import {TextLikeInput, TextLikeInputView} from "./text_like_input"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import * as inputs_css from "styles/widgets/inputs.css"

export class TextAreaInputView extends TextLikeInputView {
  declare readonly model: TextAreaInput
  declare readonly signals: p.SignalsOf<TextAreaInput.Props>
  declare readonly values: TextAreaInput.Attrs

  override component(): VNode {
    const {disabled, value, placeholder, rows, cols} = this.signals
    const {max_length} = this.values
    return (
      <UIComponent parent={this.resolved_props}>
        <div class={inputs_css.outer}>
          <div class={inputs_css.inner}>
            <textarea
              class={inputs_css.input}
              disabled={disabled}
              value={value}
              placeholder={placeholder}
              maxLength={max_length ?? undefined}
              rows={rows}
              cols={cols}
              onChange={(event) => this.model.value = event.currentTarget.value}
              onInput={(event) => this.model.value_input = event.currentTarget.value}
            />
          </div>
        </div>
      </UIComponent>
    )
  }
}

export namespace TextAreaInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TextLikeInput.Props & {
    cols: p.Property<number>
    rows: p.Property<number>
  }
}

export interface TextAreaInput extends TextAreaInput.Attrs {}

export class TextAreaInput extends TextLikeInput {
  declare properties: TextAreaInput.Props
  declare __view_type__: TextAreaInputView

  constructor(attrs?: Partial<TextAreaInput.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TextAreaInputView

    this.define<TextAreaInput.Props>(({Int}) => ({
      cols: [ Int, 20 ],
      rows: [ Int, 2 ],
    }))

    this.override<TextAreaInput.Props>({
      max_length: 500,
    })
  }
}
