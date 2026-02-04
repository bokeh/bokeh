// TODO: Should an already available package be used instead of our own vanilla implementation?
// For example:
// * i18next
// * loc-i18next
// For the moment to explore LanguageDropdown basic mock implementation created here
import type {PlainObject} from "./types"
import {isString} from "./util/types"

export class I18n {
  _locales: string[]
  _translations: PlainObject

  constructor(locales: string[], translations: string) {
    this._locales = locales
    this._translations = JSON.parse(translations)
    this.set_locale(this.get_locale())
  }

  get_locale(): string {
    const default_locale = this._locales.includes(navigator.language)? navigator.language: "en"
    const lang = localStorage.getItem("lang")
    return isString(lang)? lang: default_locale
  }

  set_locale(locale: string): void {
    if (this._locales.includes(locale)) {
      if (localStorage.getItem("lang") !== locale) {
        document.documentElement.setAttribute("lang", locale)
        localStorage.setItem("lang", locale)
        //TODO: trigger some sort of event to rerender things?
        window.location.reload()
      }
    } else {
      throw new Error("I18n.set_locale() expects a locale string available")
    }
  }

  t(key: string): string {
    const locale_translation = this._translations[this.get_locale()]
    return key.split(".").reduce(
      (current_level, current_key) => current_level?.[current_key],
      locale_translation as any,
    ) || key
  }
}

// TODO: arguments (`locales`, `translations`) should come from a call to some `Bokeh.init_i18n` call/settings?
// What should be set as default values?
export const i18n = new I18n(
  ["en", "es", "es-ES"],
  `{
    "en": {"button1":{"label": "Test en"}},
    "es": {"button1":{"label": "Prueba es"}},
    "es-ES": {"button1":{"label": "Prueba es-ES"}}
   }`,
)
