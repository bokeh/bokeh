import {BaseText, BaseTextView} from "./base_text"
import type {GraphicsBox} from "core/graphics"
import {TextBox} from "core/graphics"
import type * as p from "core/properties"

export class TranslatableTextView extends BaseTextView {
  declare model: TranslatableText
  declare translated_text: string
  declare text_box: TextBox

  override connect_signals(): void {
    super.connect_signals()

    const {text} = this.model.properties
    this.on_change(text, async () => {
      await this._build_text()
      this.parent.request_paint()
    })

    // TODO: This should use this.model.document but it seems to be always null
    // even when using root.model it can be at some points always null
    // (i.e SizeBar instances)
    const {document} = this.root.model
    if (document != null) {
      this.connect(document.config.i18n.change_locale, async () => {
        await this._build_text()
        this.parent.request_paint()
      })
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_text()
  }

  override initialize(): void {
    super.initialize()
    this.text_box = new TextBox({text: this.model.text})
    this._has_finished = true
  }

  graphics(): GraphicsBox {
    return this.text_box
  }

  protected async _build_text(): Promise<void> {
    // TODO: This should use this.model.document but it seems to be always null
    // even when using root.model it can be at some points always null
    // (i.e SizeBar instances)
    const {document} = this.root.model
    if (document != null) {
      this.translated_text = await document.config.i18n.t(this.model.text)
    } else {
      this.translated_text = this.model.text
    }

    this.text_box.text = this.translated_text
  }
}

export namespace TranslatableText {
  export type Attrs = p.AttrsOf<Props>
  export type Props = BaseText.Props
}

export interface TranslatableText extends TranslatableText.Attrs {}

export class TranslatableText extends BaseText {
  declare properties: TranslatableText.Props
  declare __view_type__: TranslatableTextView

  constructor(attrs?: Partial<TranslatableText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TranslatableTextView
  }
}
