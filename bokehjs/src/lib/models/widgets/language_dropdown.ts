import {Dropdown, DropdownView} from "./dropdown"
import {BuiltinIcon} from "../ui/icons/builtin_icon"
import {MenuItemClick} from "core/bokeh_events"
import {i18n} from "core/i18n"
import {isString} from "core/util/types"
import {Text} from "../dom/text"
import type * as p from "core/properties"

export class LanguageDropdownView extends DropdownView {
  declare model: LanguageDropdown

  override connect_signals(): void {
    super.connect_signals()

    this.model.on_event(MenuItemClick, async (event) => await this._set_language(event.item))
  }

  override async lazy_initialize(): Promise<void> {
    const lang = i18n.get_locale()
    await this._set_language(lang)
    await super.lazy_initialize()
  }

  override render(): void {
    this.model.menu = i18n.supported_languages()
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
    await i18n.set_locale(lang)
  }
}

export namespace LanguageDropdown {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Dropdown.Props
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

    this.override<LanguageDropdown.Props>({
      label: "",
      icon: () => new BuiltinIcon({icon_name: "world", size: 18}),
      button_type: "default",
    })
  }
}
