import {logger} from "core/logging"
import type {ReglWrapper} from "../glyphs/webgl/regl_wrap"
import type * as webgl_module from "../glyphs/webgl/module"

// Notes on WebGL support:
// Glyphs can be rendered into the original 2D canvas, or in a (hidden)
// webgl canvas that we create below. In this way, the rest of bokehjs
// can keep working as it is, and we can incrementally update glyphs to
// make them use GL.
//
// The WebGL implementation lives in a separate module (`models/glyphs/webgl`,
// bundled as `bokeh-gl.js`), which registers itself here when evaluated, so
// that canvases can use it synchronously. When it's not loaded by other means
// (e.g. a script tag or a static import), `load_webgl()` (see `webgl_loader`)
// loads it on demand.

export type WebGLModule = typeof webgl_module

export type WebGLState = {
  readonly canvas: HTMLCanvasElement
  readonly regl_wrapper: ReglWrapper
  /** Provides WebGL implementations of glyphs. */
  readonly module: WebGLModule
}

let _webgl_module: WebGLModule | null = null

/** Called by the WebGL module when it's evaluated. */
export function register_webgl(module: WebGLModule): void {
  _webgl_module = module
}

/** Whether the WebGL module was loaded and registered. */
export function has_webgl_module(): boolean {
  return _webgl_module != null
}

function init_webgl(module: WebGLModule): WebGLState | null {
  // We use a global invisible canvas and gl context. By having a global context,
  // we avoid the limitation of max 16 contexts that most browsers have.
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
  })

  if (gl == null) {
    logger.trace("WebGL is not supported")
    return null
  }

  const regl_wrapper = module.get_regl(gl)
  if (!regl_wrapper.has_webgl) {
    logger.trace("WebGL is supported, but not the required extensions")
    return null
  }

  return {canvas, regl_wrapper, module}
}

/**
 * The cached result of `init_webgl()`: `undefined` if it wasn't attempted yet,
 * `null` if WebGL isn't usable (this is final), otherwise the shared state.
 * It stays `undefined` while the WebGL module isn't registered, because the
 * module may still be loaded later.
 */
let _global_webgl: WebGLState | null | undefined

/**
 * Returns the WebGL state shared by all canvases, or `null` if WebGL isn't
 * available, including when the WebGL module wasn't loaded (yet).
 */
export function global_webgl(): WebGLState | null {
  if (_global_webgl === undefined) {
    if (_webgl_module == null) {
      // not cached, because the module may be registered later
      logger.trace("WebGL module (bokeh-gl.js bundle) is not available")
      return null
    }
    _global_webgl = init_webgl(_webgl_module)
  }
  return _global_webgl
}
