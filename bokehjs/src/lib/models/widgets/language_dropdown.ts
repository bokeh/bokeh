import {Dropdown, DropdownView} from "./dropdown"
import {BuiltinIcon} from "../ui/icons/builtin_icon"
import {MenuItemClick} from "core/bokeh_events"
import {i18n} from "core/i18n"
import type * as p from "core/properties"

export class LanguageDropdownView extends DropdownView {
  declare model: LanguageDropdown

  override connect_signals(): void {
    super.connect_signals()

    this.model.on_event(MenuItemClick, (event) => this._set_language(event.item))
  }

  override render(): void {
    this.model.menu = i18n.supported_languages()
    super.render()

    const lang = this._get_language()
    this._set_language(lang)
  }

  protected _set_language(lang: string): void {
    this.model.label = lang.toUpperCase()
    i18n.set_locale(lang)
  }

  protected _get_language(): string {
    return i18n.get_locale()
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
