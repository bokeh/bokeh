import {Text, TextView} from "./text"
import type * as p from "core/properties"

export class TranslatableTextView extends TextView {
  declare model: TranslatableText
  declare translated_text: string
  declare el: globalThis.Text

  override connect_signals(): void {
    super.connect_signals()

    const {content} = this.model.properties
    this.on_change(content, async () => {
      await this._build_text()
      this.render()
    })

    // TODO: This should use this.model.document but it seems to be always null
    const {document} = this.root.model
    if (document != null) {
      this.connect(document.config.i18n.change_locale, async () => {
        await this._build_text()
        this.rerender()
      })
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._build_text()
  }

  override render(): void {
    this.el.textContent = this.translated_text
  }

  protected async _build_text(): Promise<void> {
    // TODO: This should use this.model.document but it seems to be always null
    const {document} = this.root.model
    if (document != null) {
      this.translated_text = await document.config.i18n.t(this.model.content)
    }
  }
}

export namespace TranslatableText {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Text.Props
}

export interface TranslatableText extends TranslatableText.Attrs {}

export class TranslatableText extends Text {
  declare properties: TranslatableText.Props
  declare __view_type__: TranslatableTextView

  constructor(attrs?: Partial<TranslatableText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TranslatableTextView
  }
}
