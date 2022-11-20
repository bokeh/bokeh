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

declare interface OffscreenCanvas {
  getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): OffscreenCanvasRenderingContext2D | null
  getContext(contextId: "bitmaprenderer", options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null
  getContext(contextId: "webgl", options?: WebGLContextAttributes): WebGLRenderingContext | null
  getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null
  getContext(contextId: OffscreenRenderingContextId, options?: any): OffscreenRenderingContext | null
}
