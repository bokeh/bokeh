import type {MathJaxAPI} from "../../external/mathjax"

// The bundled MathJax implementation lives in a separate module (`models/text/mathjax`,
// bundled as `bokeh-mathjax.js`), which registers itself here when evaluated, so
// that it can be used synchronously. When it's not loaded by other means (e.g. a
// script tag or a static import), `BundleProvider.fetch()` loads it on demand.
//
// This is separate from `./providers`, because the dynamic import there would
// otherwise form a cycle with the MathJax module importing this registry.

let _mathjax: MathJaxAPI | null = null

/** Called by the MathJax module when it's evaluated. */
export function register_mathjax(api: MathJaxAPI): void {
  _mathjax = api
}

/** The registered MathJax implementation, or `null` if it wasn't loaded (yet). */
export function registered_mathjax(): MathJaxAPI | null {
  return _mathjax
}
