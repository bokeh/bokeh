import {BaseText, BaseTextView} from "./base_text"
import type {GraphicsBox} from "core/graphics"
import {TextBox} from "core/graphics"
import {i18n} from "core/i18n"
import type * as p from "core/properties"

export class TranslatableTextView extends BaseTextView {
  declare model: TranslatableText
  declare translated_text: string

  override connect_signals(): void {
    super.connect_signals()

    const {text} = this.model.properties
    this.on_change(text, async () => {
      await this._build_text()
      this.parent.request_paint()
    })

    this.connect(i18n.change_locale, async () => {
      await this._build_text()
      this.parent.request_paint()
    })
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_text()
  }

  override initialize(): void {
    super.initialize()
    this._has_finished = true
  }

  graphics(): GraphicsBox {
    return new TextBox({text: this.translated_text})
  }

  protected async _build_text(): Promise<void> {
    this.translated_text = await i18n.t(this.model.text)
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
