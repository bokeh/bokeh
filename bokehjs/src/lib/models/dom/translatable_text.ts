import type {Dict} from "core/types"
import {Text, TextView} from "./text"
import type * as p from "core/properties"

export class TranslatableTextView extends TextView {
  declare model: TranslatableText
  translated_text: string

  override connect_signals(): void {
    super.connect_signals()

    const {content, options} = this.model.properties
    this.on_change(content, async () => {
      await this._build_text()
      this.render()
    })
    this.on_change(options, async () => {
      await this._build_text()
      this.render()
    })

    const {document} = this.model
    if (document != null) {
      this.connect(document.config.i18n.change_locale_config, async () => {
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
    const {document} = this.model
    if (document != null) {
      const {content, options} = this.model
      this.translated_text = await document.config.i18n.t(content, options)
    }
  }
}

export namespace TranslatableText {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Text.Props & {
    options: p.Property<Dict<Dict<string | any>>>
  }
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

    this.define<TranslatableText.Props>(({Str, Dict, Any, Or}) => ({
      options: [ Dict(Dict(Or(Str, Any))), {} ],
    }))
  }
}
