import {TextLikeInput, TextLikeInputView} from "./text_like_input"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import type * as p from "core/properties"
import {InlineStyleSheet} from "core/dom"
import * as inputs_css from "styles/widgets/inputs.css"

import {createRef} from "preact"

export class TextAreaInputView extends TextLikeInputView {
  declare readonly model: TextAreaInput
  declare readonly signals: p.SignalsOf<TextAreaInput.Props>
  declare readonly values: TextAreaInput.Attrs

  protected readonly _textarea_ref = createRef<HTMLTextAreaElement>()

  /**
   * Minimum size of a (vertically) resizable widget, so that the text area
   * can't be collapsed below one line of text.
   */
  protected readonly _min_size = new InlineStyleSheet("", "min_size")

  override computed_stylesheets(): InlineStyleSheet[] {
    return [...super.computed_stylesheets(), this._min_size]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {resizable, min_height} = this.model.properties
    this.on_change([resizable, min_height], () => this._update_min_size())
  }

  // Not `_after_resize()`, because it's skipped when a parent layout updated our bbox first.
  override after_resize(): void {
    super.after_resize()
    this._update_min_size()
  }

  protected _update_min_size(): void {
    const {resizable, min_height} = this.model
    const textarea = this._textarea_ref.current
    const vertically = resizable === true || resizable == "both" || resizable == "height"
    if (!vertically || min_height != null || textarea == null) {
      this._min_size.clear()
    } else {
      // everything around text area's content box (e.g. title), plus one line of text
      const surroundings = this.el.scrollHeight - textarea.clientHeight
      this._min_size.replace(`${this.host_selector} { min-height: calc(${surroundings}px + 1lh); }`)
    }
  }

  override component(): VNode {
    const {disabled, value, placeholder, rows, cols} = this.signals
    const {max_length} = this.values
    const Title = this._title_el
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div class={inputs_css.outer}>
          <div class={inputs_css.inner}>
            <textarea
              ref={this._textarea_ref}
              id={this.input_id}
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
