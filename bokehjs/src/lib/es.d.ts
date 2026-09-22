// XXX: remove this when https://github.com/microsoft/TypeScript/issues/4586 is fixed

interface Array<T> {
  constructor: ArrayConstructor
}

interface Uint8Array {
  constructor: Uint8ArrayConstructor
}

interface Int8Array {
  constructor: Int8ArrayConstructor
}

interface Uint16Array {
  constructor: Uint16ArrayConstructor
}

interface Int16Array {
  constructor: Int16ArrayConstructor
}

interface Uint32Array {
  constructor: Uint32ArrayConstructor
}

interface Int32Array {
  constructor: Int32ArrayConstructor
}

interface Float32Array {
  constructor: Float32ArrayConstructor
}

interface Float64Array {
  constructor: Float64ArrayConstructor
}

interface Element {
  webkitRequestFullscreen(options?: FullscreenOptions): Promise<void>
}

// from lib.esnext.d.ts (needs TS 6/7) (remove when #15012 is resolved)
interface Uint8Array<TArrayBuffer extends ArrayBufferLike> {
  /**
   * Converts the `Uint8Array` to a base64-encoded string.
   * @param options If provided, sets the alphabet and padding behavior used.
   * @returns A base64-encoded string.
   */
  toBase64(
    options?: {
      alphabet?: "base64" | "base64url" | undefined
      omitPadding?: boolean | undefined
    },
  ): string
}

// from lib.esnext.d.ts (needs TS 6/7) (remove when #15012 is resolved)
interface Uint8ArrayConstructor {
  /**
   * Creates a new `Uint8Array` from a base64-encoded string.
   * @param string The base64-encoded string.
   * @param options If provided, specifies the alphabet and handling of the last chunk.
   * @returns A new `Uint8Array` instance.
   * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
   * chunk is inconsistent with the `lastChunkHandling` option.
   */
  fromBase64(
    string: string,
    options?: {
      alphabet?: "base64" | "base64url" | undefined
      lastChunkHandling?: "loose" | "strict" | "stop-before-partial" | undefined
    },
  ): Uint8Array<ArrayBuffer>
}

// from lib.dom.d.ts (needs TS 6/7) (remove when #15012 is resolved)
interface HTMLElement {
  showPopover(options?: {source?: Element}): void
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
