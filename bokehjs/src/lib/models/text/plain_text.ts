import {BaseText, BaseTextView} from "./base_text"
import {GraphicsBox, TextBox} from "core/graphics"
import * as p from "core/properties"

export class PlainTextView extends BaseTextView {
  override model: PlainText

  override initialize(): void {
    super.initialize()
    this._has_finished = true
  }

  graphics(): GraphicsBox {
    return new TextBox({text: this.model.text})
  }
}

export namespace PlainText {
  export type Attrs = p.AttrsOf<Props>
  export type Props = BaseText.Props
}

export interface PlainText extends PlainText.Attrs {}

export class PlainText extends BaseText {
  override properties: PlainText.Props
  override __view_type__: PlainTextView

  constructor(attrs?: Partial<PlainText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PlainTextView
  }
}
