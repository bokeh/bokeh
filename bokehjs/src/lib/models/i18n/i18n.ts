// For the moment, basic mock implementation created here that also explores the Chrome Translator API
import type {Dict} from "core/types"
import {logger} from "core/logging"
import {to_object} from "core/util/object"
import {isString} from "core/util/types"
import {Signal0} from "core/signaling"
import {Model} from "../../model"
import type * as p from "core/properties"

export namespace I18n {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    locales_codes: p.Property<string[]>
    translations: p.Property<Dict<Dict<string | any>>>
    languages: p.Property<[string, string][]>
    source_language: p.Property<string>
    auto_t_enabled: p.Property<boolean>
  }
}

export interface I18n extends I18n.Attrs {}

export class I18n extends Model {
  readonly change_locale = new Signal0(this, "change_locale")
  readonly change_config = new Signal0(this, "change_config")

  _translator: Translator | undefined

  constructor(attrs?: Partial<I18n.Attrs>) {
    super(attrs)
  }

  static {
    this.define<I18n.Props>(({Bool, Str, List, Tuple, Dict, Any, Or}) => ({
      locales_codes: [ List(Str), ["en"] ],
      translations: [ Dict(Dict(Or(Str, Any))), {} ],
      languages: [ List(Tuple(Str, Str)), [["English", "en"]] ],
      source_language: [ Str, "en"],
      auto_t_enabled: [ Bool, false ],
    }))
  }

  supported_languages(): [string, string][] {
    return this.languages
  }

  get_locale(): string {
    const default_locale = this.locales_codes.includes(navigator.language) ? navigator.language : this.source_language
    let current_locale = localStorage.getItem("lang")
    if (!isString(current_locale) || !this.locales_codes.includes(current_locale)) {
      localStorage.setItem("lang", default_locale)
      current_locale = default_locale
    }
    return current_locale
  }

  async set_locale(locale: string, force: boolean): Promise<void> {
    if (this.locales_codes.includes(locale)) {
      document.documentElement.setAttribute("lang", locale)
      if (localStorage.getItem("lang") !== locale || force) {
        localStorage.setItem("lang", locale)
        const translator_availability = await this._init_translator()
        const download_translator = ["downloadable", "downloading"]
        if (!download_translator.includes(translator_availability)) {
          this.change_locale.emit()
        }
      } else if (this._translator == null) {
        await this._init_translator()
      }
    } else {
      const locales_codes = this.locales_codes.map(locale => `'${locale}'`).join(", ")
      logger.warn(`I18n.set_locale() expects a valid locale string: ${locales_codes}. Locale is still '${localStorage.getItem("lang")}'`)
    }
  }

  async t(key: string, options: Dict<Dict<string | any>> = {}): Promise<string> {
    if (this.auto_t_enabled) {
      return await this._auto_t(key, options)
    } else {
      return this._t(key, options)
    }
  }

  protected async _init_translator(): Promise<Availability> {
    let availability: Availability = "unavailable"
    // Based on https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs/Using#complete_example
    if (typeof Translator !== "undefined") {
      availability = await Translator.availability({
        sourceLanguage: this.source_language,
        targetLanguage: this.get_locale(),
      })
      if (availability === "available") {
        this._translator = await Translator.create({
          sourceLanguage: this.source_language,
          targetLanguage: this.get_locale(),
        })
      } else if (availability === "downloadable") {
        this._translator = await Translator.create({
          sourceLanguage: this.source_language,
          targetLanguage: this.get_locale(),
          monitor(monitor: CreateMonitor) {
            monitor.addEventListener("downloadprogress", (e: ProgressEvent) => {
              const progress = Math.floor(e.loaded * 100)
              logger.debug(`Downloading ${localStorage.getItem("lang")} - ${progress}`)
            })
          },
        })
        this.change_locale.emit()
      } else if (availability === "unavailable") {
        this._translator = undefined
      }
    }

    return availability
  }

  protected async _auto_t(key: string, options: Dict<Dict<string | any>> = {}): Promise<string> {
    let translation = this._t(key, options)
    if (typeof this._translator !== "undefined" && translation === key) {
      translation = await this._translator.translate(key)
    }
    return translation
  }

  protected _t(key: string, options: Dict<Dict<string | any>> = {}): string {
    const locale_translation = to_object(this.translations)[this.get_locale()]
    const translation_string = key.split(".").reduce(
      (current_level, current_key) => current_level?.[current_key],
      locale_translation as any,
    ) ?? key

    // TODO: Use args to allow for interpolation, formatting, nesting, plurals, etc
    // (use Intl for formatting options - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
    if ("interpolation" in options) {
      const variables = to_object(options.interpolation)
      return translation_string.replace(/\{{(\w+)}}/g, (_: string, key: string) => variables[key] ?? "")
    }

    return translation_string
  }

  // TODO: Should this be defined over the document class?
  set_config(locales_codes: string[] | null, translations: string | null, languages: [string, string][] | null, source_language: string | null, auto_t_enabled: boolean | null): void {
    if (locales_codes != null && translations != null && languages != null && source_language != null && auto_t_enabled != null) {
      this.locales_codes = locales_codes
      // TODO: Handle possible errors when parsing translations
      this.translations = JSON.parse(translations)
      this.languages = languages
      this.source_language = source_language
      this.auto_t_enabled = auto_t_enabled
      this.change_config.emit()
    }
  }
}
