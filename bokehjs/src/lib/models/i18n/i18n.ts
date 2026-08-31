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
    locale: p.Property<string>
    locales_codes: p.Property<string[]>
    translations: p.Property<Dict<Dict<string | any>>>
    languages: p.Property<[string, string][]>
    source_language: p.Property<string>
    auto_t_enabled: p.Property<boolean>
  }
}

export interface I18n extends I18n.Attrs {}

export class I18n extends Model {
  readonly change_locale_config = new Signal0(this, "change_locale_config")

  _translator: Translator | undefined
  _locale: string

  constructor(attrs?: Partial<I18n.Attrs>) {
    super(attrs)
  }

  static {
    this.define<I18n.Props>(({Bool, Str, List, Tuple, Dict, Any, Or}) => ({
      locale: [ Str, "en" ],
      locales_codes: [ List(Str), ["en"] ],
      translations: [ Dict(Dict(Or(Str, Any))), {} ],
      languages: [ List(Tuple(Str, Str)), [["English", "en"]] ],
      source_language: [ Str, "en"],
      auto_t_enabled: [ Bool, false ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    const {locale, locales_codes, translations, source_language, auto_t_enabled} = this.properties as I18n.Props
    this.on_change(locale, async () => {
      this._set_locale(this.locale, true)
      await this._config_update()
    })

    this.on_change(locales_codes, async () => {
      this._set_locale(this.locale, true)
      await this._config_update()
    })

    this.on_change(translations, async () => {
      await this._config_update()
    })

    this.on_change(source_language, async () => {
      await this._config_update()
    })

    this.on_change(auto_t_enabled, async () => {
      await this._config_update()
    })

    this._set_locale(this.locale, true)
    // TODO: Check better way to handle this
    this._config_update().catch(() => logger.warn("Failed to change i18n config!"))
  }

  async t(key: string, options: Dict<Dict<string | any>> = {}): Promise<string> {
    if (this.auto_t_enabled) {
      return await this._auto_t(key, options)
    } else {
      return this._t(key, options)
    }
  }

  protected _set_locale(locale: string, force: boolean): void {
    if (this.locales_codes.includes(locale)) {
      if (this._locale !== locale || force) {
        this._locale = locale
      }
    } else {
      const fallback_locale = this.locales_codes.includes(navigator.language) ? navigator.language : this.locales_codes[0]
      this._locale = fallback_locale
      const locales_codes = this.locales_codes.map(locale => `'${locale}'`).join(", ")
      logger.warn(`I18n.set_locale() expects a valid locale string: ${locales_codes}. Locale provided was ${locale}. Locale is '${this._locale}'`)
    }
    this.setv({locale: this._locale}, {silent: true})
  }

  protected async _config_update(): Promise<void> {
    if (this.auto_t_enabled) {
      const translator_availability = await this._init_translator()
      const download_translator = ["downloadable", "downloading"]
      if (!download_translator.includes(translator_availability)) {
        this.change_locale_config.emit()
      }
    } else {
      this._translator = undefined
      this.change_locale_config.emit()
    }
  }

  protected async _init_translator(): Promise<Availability> {
    let availability: Availability = "unavailable"
    // Based on https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs/Using#complete_example
    if (typeof Translator !== "undefined") {
      availability = await Translator.availability({
        sourceLanguage: this.source_language,
        targetLanguage: this.locale,
      })
      if (availability === "available") {
        this._translator = await Translator.create({
          sourceLanguage: this.source_language,
          targetLanguage: this.locale,
        })
      } else if (availability === "downloadable") {
        this._translator = await Translator.create({
          sourceLanguage: this.source_language,
          targetLanguage: this.locale,
          monitor(monitor: CreateMonitor) {
            monitor.addEventListener("downloadprogress", (e: ProgressEvent) => {
              const progress = `${e.loaded}/${e.total}`
              logger.debug(`Downloading translator model - ${progress}`)
            })
          },
        })
        this.change_locale_config.emit()
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

  protected _interpolation(translation_string: string, options: Dict<Dict<string | any>> = {}): string {
    // TODO: Use args to allow for interpolation, formatting, nesting, plurals, etc
    // (use Intl for formatting options - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
    let interpolated_string = translation_string
    if ("interpolation" in options) {
      const variables = to_object(options.interpolation)
      interpolated_string = translation_string.replace(
        /\{{(\w+)}}/g,
        (_: string, key: string) => {
          const variable = variables[key]?.value ?? `{{${key}}}`
          if (variable != `{{${key}}}` && "formatting" in variables[key]) {
            const formatting = variables[key].formatting
            switch (formatting.format) {
              case "date":
                const date = variable instanceof Date ? variable : new Date(variable)
                if (!isNaN(date.getTime())) {
                  return new Intl.DateTimeFormat(this.locale, formatting.options ?? {}).format(date)
                }
                return variable
              case "display":
                return new Intl.DisplayNames([this.locale], formatting.options ?? {}).of(variable) ?? variable
              case "list":
                return new Intl.ListFormat(this.locale, formatting.options ?? {}).format(variable)
              case "number":
                return new Intl.NumberFormat(this.locale, formatting.options ?? {}).format(variable)
              default:
                return variable
            }
          }
          return variable
        })
    }
    return interpolated_string
  }

  protected _t(key: string, options: Dict<Dict<string | any>> = {}): string {
    const translations = to_object(this.translations)
    const locale_translation = to_object(translations[this.locale] ?? {})
    let translation_string = locale_translation[key]
    if (!isString(translation_string)) {
      translation_string = key.split(".").reduce(
        (current_level, current_key) => current_level?.[current_key],
        locale_translation as any,
      ) ?? key
    }

    return this._interpolation(translation_string, options)
  }
}
