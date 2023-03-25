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
