import {Dropdown, DropdownView} from "./dropdown"
import {BuiltinIcon} from "../ui/icons/builtin_icon"
import {MenuItemClick} from "core/bokeh_events"
import {isString} from "core/util/types"
import {Text} from "../dom/text"
import type * as p from "core/properties"

export class LanguageDropdownView extends DropdownView {
  declare model: LanguageDropdown

  override connect_signals(): void {
    super.connect_signals()

    this.model.on_event(MenuItemClick, async (event) => await this._set_language(event.item))
  }

  override initialize(): void {
    super.initialize()
    // TODO: All of these values should come/be config from a call to the document.config model
    const {document, locales_codes, translations, languages, source_language, auto_t_enabled} = this.model
    if (document != null) {
      document.config.i18n.set_config(
        locales_codes, translations, languages, source_language, auto_t_enabled,
      )
    }
  }

  override async lazy_initialize(): Promise<void> {
    let lang = "en"
    const {document} = this.model
    if (document != null) {
      lang = document.config.i18n.get_locale()
    }
    await this._set_language(lang)
    await super.lazy_initialize()
  }

  override render(): void {
    const {document} = this.model
    if (document != null) {
      this.model.menu = document.config.i18n.supported_languages()
    }
    super.render()
  }

  override async _rebuild_label(): Promise<void> {
    this.label_view?.remove()
    const label = await (async () => {
      const {label} = this.model
      return isString(label) ? new Text({content: label}) : label
    })()
    this.label_view = await this.owner.build_view(label, this)
  }

  protected async _set_language(lang: string): Promise<void> {
    this.model.label = lang.toUpperCase()
    const {document} = this.model
    if (document != null) {
      await document.config.i18n.set_locale(lang)
    }
  }
}

export namespace LanguageDropdown {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Dropdown.Props & {
    locales_codes: p.Property<string[] | null>
    translations: p.Property<string | null>
    languages: p.Property<[string, string][] | null>
    source_language: p.Property<string | null>
    auto_t_enabled: p.Property<boolean | null>
  }
}

export interface LanguageDropdown extends LanguageDropdown.Attrs {}

export class LanguageDropdown extends Dropdown {
  declare properties: LanguageDropdown.Props
  declare __view_type__: LanguageDropdownView

  constructor(attrs?: Partial<LanguageDropdown.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LanguageDropdownView

    this.define<LanguageDropdown.Props>(({Bool, Str, List, Tuple, Nullable}) => ({
      locales_codes: [ Nullable(List(Str)), null ],
      translations: [ Nullable(Str), null ],
      languages: [ Nullable(List(Tuple(Str, Str))), null ],
      source_language: [ Nullable(Str), null ],
      auto_t_enabled: [ Nullable(Bool), null ],
    }))

    this.override<LanguageDropdown.Props>({
      label: "",
      icon: () => new BuiltinIcon({icon_name: "world", size: 18}),
      button_type: "default",
    })
  }
}
