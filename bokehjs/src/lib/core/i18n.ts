// TODO: Should an already available package be used instead of our own vanilla implementation?
// For example:
// * i18next
// * loc-i18next
// For the moment, to explore LanguageDropdown, basic mock implementation created here that also explores the Chrome Translator API
import type {PlainObject} from "./types"
import {isString} from "./util/types"

export class I18n {
  _locales_codes: string[]
  _translations: PlainObject
  _languages: [string, string][]
  _source_language: string
  _translator: Translator | undefined

  constructor(locales_codes: string[], translations: string, languages: [string, string][], source_language: string) {
    this._locales_codes = locales_codes
    this._translations = JSON.parse(translations)
    this._languages = languages
    this._source_language = source_language
  }

  get_locale(): string {
    const default_locale = this._locales_codes.includes(navigator.language)? navigator.language: this._source_language
    const lang = localStorage.getItem("lang")
    return isString(lang)? lang: default_locale
  }

  async set_locale(locale: string): Promise<void> {
    if (this._locales_codes.includes(locale)) {
      if (localStorage.getItem("lang") !== locale) {
        document.documentElement.setAttribute("lang", locale)
        localStorage.setItem("lang", locale)
        const translator_availability = await this.init_translator()
        const download_translator = ["downloadable", "downloading"]
        if (!download_translator.includes(translator_availability)) {
          // TODO: trigger some sort of event to rerender things?
          window.location.reload()
        }
      } else if (typeof this._translator === "undefined") {
        await this.init_translator()
      }
    } else {
      throw new Error("I18n.set_locale() expects a locale string available")
    }
  }

  async init_translator(): Promise<string> {
    let availability = "unavailable"
    // Based on https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs/Using#complete_example
    if (typeof Translator !== "undefined") {
      availability = await Translator.availability({
        sourceLanguage: this._source_language,
        targetLanguage: this.get_locale(),
      })
      if (availability === "available") {
        this._translator = await Translator.create({
          sourceLanguage: this._source_language,
          targetLanguage: this.get_locale(),
        })
      } else if (availability === "downloadable") {
        this._translator = await Translator.create({
          sourceLanguage: this._source_language,
          targetLanguage: this.get_locale(),
          monitor(monitor: CreateMonitor) {
            monitor.addEventListener("downloadprogress", (e: ProgressEvent) => {
              const progress = Math.floor(e.loaded * 100)
              if (progress === 100) {
                // TODO: trigger some sort of event to rerender things?
                window.location.reload()
              }
            })
          },
        })
      }
    }

    return availability
  }

  async auto_t(key: string): Promise<string> {
    let translation = this.t(key)
    if (typeof this._translator !== "undefined" && translation === key) {
      translation = await this._translator.translate(key)
    }
    return translation
  }

  t(key: string): string {
    const locale_translation = this._translations[this.get_locale()]
    return key.split(".").reduce(
      (current_level, current_key) => current_level?.[current_key],
      locale_translation as any,
    ) || key
  }

  supported_languages(): [string, string][] {
    return this._languages
  }
}

// TODO: arguments (`locales`, `translations`, `languages`, `source_language` ) should come from a call to some `Bokeh.init_i18n` call/settings?
// What should be set as default values?
export const i18n = new I18n(
  ["en", "es-CO", "es-ES", "pl-PL", "fr-FR", "de-DE", "hi-IN", "pt-BR"],
  `{
    "en": {"button1":{"label": "Test en"}},
    "es-CO": {"button1":{"label": "Prueba es-CO"}},
    "es-ES": {"button1":{"label": "Prueba es-ES"}},
    "pl-PL": {},
    "fr-FR": {},
    "de-DE": {},
    "hi-IN": {},
    "pt-BR": {}
   }`,
  [
    ["English", "en"],
    ["Español (ES)", "es-ES"],
    ["Español (CO)", "es-CO"],
    ["Polski (PL)", "pl-PL"],
    ["Français (FR)", "fr-FR"],
    ["Deutsch (DE)", "de-DE"],
    ["हिन्दी", "hi-IN"],
    ["Português (BR)", "pt-BR"],
  ],
  "en",
)

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
