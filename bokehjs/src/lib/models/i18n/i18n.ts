// For the moment, basic mock implementation created here that also explores the Chrome Translator API
import type {PlainObject} from "core/types"
import {isString} from "core/util/types"
import {Signal0} from "core/signaling"
import {Model} from "../../model"
import type * as p from "core/properties"

export namespace I18n {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    locales_codes: p.Property<string[]>
    translations: p.Property<PlainObject>
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
    this.define<I18n.Props>(({Bool, Any, Str, List, Tuple}) => ({
      locales_codes: [ List(Str), ["en"] ],
      // TODO: This shouldn't be Any
      translations: [ Any, {} ],
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
      throw new Error("I18n.set_locale() expects a locale string available")
    }
  }

  async t(key: string): Promise<string> {
    // TODO: Expose args to allow for interpolation, formatting, nesting, plurals, etc
    // (use Intl - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl - based implementation over `_t`)
    if (this.auto_t_enabled) {
      return await this._auto_t(key)
    } else {
      return this._t(key)
    }
  }

  protected async _init_translator(): Promise<string> {
    let availability = "unavailable"
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
              console.info(`Downloading ${localStorage.getItem("lang")} - ${progress}`)
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

  protected async _auto_t(key: string): Promise<string> {
    let translation = this._t(key)
    if (typeof this._translator !== "undefined" && translation === key) {
      translation = await this._translator.translate(key)
    }
    return translation
  }

  protected _t(key: string): string {
    const locale_translation = this.translations[this.get_locale()]
    return key.split(".").reduce(
      (current_level, current_key) => current_level?.[current_key],
      locale_translation as any,
    ) ?? key
  }

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

// Translator and LanguageDetector API typing
// Taken from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/dom-chromium-ai/index.d.ts
// to not add a dependency on npm package @types/dom-chromium-ai for the moment
// Shared infrastructure
// https://webmachinelearning.github.io/writing-assistance-apis/#supporting

interface CreateMonitor extends EventTarget {
  ondownloadprogress: ((this: CreateMonitor, ev: ProgressEvent) => any) | null

  addEventListener<K extends keyof CreateMonitorEventMap>(
    type: K,
    listener: (this: CreateMonitor, ev: CreateMonitorEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener<K extends keyof CreateMonitorEventMap>(
    type: K,
    listener: (this: CreateMonitor, ev: CreateMonitorEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
}

interface CreateMonitorEventMap {
  downloadprogress: ProgressEvent
}

type CreateMonitorCallback = (monitor: CreateMonitor) => void

type Availability = "unavailable" | "downloadable" | "downloading" | "available"

interface DestroyableModel {
  destroy(): void
}

// Translator and Language Detector APIs
// https://webmachinelearning.github.io/translation-api/#idl-index

declare abstract class Translator implements DestroyableModel {
  static create(options: TranslatorCreateOptions): Promise<Translator>
  static availability(options: TranslatorCreateCoreOptions): Promise<Availability>

  translate(input: string, options?: TranslatorTranslateOptions): Promise<string>
  translateStreaming(input: string, options?: TranslatorTranslateOptions): ReadableStream<string>

  readonly sourceLanguage: string
  readonly targetLanguage: string

  measureInputUsage(input: string, options?: TranslatorTranslateOptions): Promise<number>

  readonly inputQuota: number

  destroy(): void
}

interface TranslatorCreateCoreOptions {
  sourceLanguage: string
  targetLanguage: string
}

interface TranslatorCreateOptions extends TranslatorCreateCoreOptions {
  signal?: AbortSignal
  monitor?: CreateMonitorCallback
}

interface TranslatorTranslateOptions {
  signal?: AbortSignal
}

declare abstract class LanguageDetector implements DestroyableModel {
  static create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>
  static availability(options?: LanguageDetectorCreateCoreOptions): Promise<Availability>

  detect(input: string, options?: LanguageDetectorDetectOptions): Promise<LanguageDetectionResult[]>

  readonly expectedInputLanguages: ReadonlyArray<string>

  measureInputUsage(input: string, options?: LanguageDetectorDetectOptions): Promise<number>

  readonly inputQuota: number

  destroy(): void
}

interface LanguageDetectorCreateCoreOptions {
  expectedInputLanguages?: string[]
}

interface LanguageDetectorCreateOptions extends LanguageDetectorCreateCoreOptions {
  signal?: AbortSignal
  monitor?: CreateMonitorCallback
}

interface LanguageDetectorDetectOptions {
  signal?: AbortSignal
}

interface LanguageDetectionResult {
  detectedLanguage?: string
  confidence?: number
}
