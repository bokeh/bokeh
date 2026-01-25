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

// from lib.esnext.d.ts (needs TS 6/7)
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

// from lib.esnext.d.ts (needs TS 6/7)
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
