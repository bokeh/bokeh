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

declare interface ShadowRoot {
  adoptedStyleSheets: readonly StyleSheet[]
}

declare interface CSSStyleSheet {
  replaceSync(text: string): void
}

declare interface OffscreenCanvas extends EventTarget {
  height: number
  width: number

  convertToBlob(options?: ImageEncodeOptions): Promise<Blob>

  getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): OffscreenCanvasRenderingContext2D | null
  getContext(contextId: "bitmaprenderer", options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null
  getContext(contextId: "webgl", options?: WebGLContextAttributes): WebGLRenderingContext | null
  getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null
  getContext(contextId: OffscreenRenderingContextId, options?: any): OffscreenRenderingContext | null
  transferToImageBitmap(): ImageBitmap
}

declare let OffscreenCanvas: {
  prototype: OffscreenCanvas
  new(width: number, height: number): OffscreenCanvas
}

declare interface OffscreenCanvasRenderingContext2D extends CanvasCompositing, CanvasDrawImage, CanvasDrawPath,
    CanvasFillStrokeStyles, CanvasFilters, CanvasImageData, CanvasImageSmoothing, CanvasPath,
    CanvasPathDrawingStyles, CanvasRect, CanvasShadowStyles, CanvasState, CanvasText,
    CanvasTextDrawingStyles, CanvasTransform {
  readonly canvas: OffscreenCanvas
  commit(): void
}

declare let OffscreenCanvasRenderingContext2D: {
  prototype: OffscreenCanvasRenderingContext2D
  new(): OffscreenCanvasRenderingContext2D
}
