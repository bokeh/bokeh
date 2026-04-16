import {InputWidget, InputWidgetView} from "./input_widget"
import type * as p from "core/properties"

export abstract class TextLikeInputView extends InputWidgetView {
  declare model: TextLikeInput

  /// TODO remove
  protected override _render_input(): HTMLElement {
    return undefined as any
  }
  ///
}

export namespace TextLikeInput {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value: p.Property<string>
    value_input: p.Property<string>
    placeholder: p.Property<string>
    max_length: p.Property<number | null>
  }
}

export interface TextLikeInput extends TextLikeInput.Attrs {}

export class TextLikeInput extends InputWidget {
  declare properties: TextLikeInput.Props
  declare __view_type__: TextLikeInputView

  constructor(attrs?: Partial<TextLikeInput.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TextLikeInput.Props>(({Int, Str, Nullable}) => ({
      value:       [ Str, "" ],
      value_input: [ Str, "" ],
      placeholder: [ Str, "" ],
      max_length:  [ Nullable(Int), null ],
    }))
  }
}
