import {BaseText, BaseTextView} from "./base_text"
import type {GraphicsBox} from "core/graphics"
import {TextBox} from "core/graphics"
import type * as p from "core/properties"

export class PlainTextView extends BaseTextView {
  declare model: PlainText

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
  declare properties: PlainText.Props
  declare __view_type__: PlainTextView

  constructor(attrs?: Partial<PlainText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PlainTextView
  }
}
