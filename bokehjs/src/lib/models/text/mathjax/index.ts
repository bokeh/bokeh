import type {MathJaxConvertOptions, MathJaxProtoItem, MathJaxTeXMacros} from "../../../external/mathjax"

import {mathjax} from "mathjax-full/js/mathjax.js"
import {TeX} from "mathjax-full/js/input/tex.js"
import {MathML} from "mathjax-full/js/input/mathml.js"
// import {AsciiMath} from "mathjax-full/js/input/asciimath.js"
import {SVG} from "mathjax-full/js/output/svg.js"
import {CHTML} from "mathjax-full/js/output/chtml.js"
import {browserAdaptor} from "mathjax-full/js/adaptors/browserAdaptor.js"
import {RegisterHTMLHandler} from "mathjax-full/js/handlers/html.js"
import {AllPackages} from "mathjax-full/js/input/tex/AllPackages.js"
import {FindTeX} from "mathjax-full/js/input/tex/FindTeX.js"

// Defer the browser adaptor so importing this module doesn't require a DOM.
let registered = false
let svg: SVG<unknown, unknown, unknown> | null = null
let chtml: CHTML<unknown, unknown, unknown> | null = null

function register(): void {
  if (!registered) {
    const adaptor = browserAdaptor()
    RegisterHTMLHandler(adaptor)
    registered = true
  }
}

function svg_output(): SVG<unknown, unknown, unknown> {
  if (svg == null) {
    register()
    svg = new SVG({fontCache: "local"})
  }
  return svg
}

function chtml_output(): CHTML<unknown, unknown, unknown> {
  if (chtml == null) {
    register()
    chtml = new CHTML()
  }
  return chtml
}

const defaults: MathJaxConvertOptions = {
  display: true,
  em: 16,
  ex: 8,
  containerWidth: 80*16,
}

export function tex2html(formula: string, options?: MathJaxConvertOptions, macros: MathJaxTeXMacros = {}): HTMLElement {
  const tex = new TeX({packages: AllPackages, macros})
  const tex_to_chtml = mathjax.document("", {InputJax: tex, OutputJax: chtml_output()})
  return tex_to_chtml.convert(formula, {...defaults, ...options})
}

export function tex2svg(formula: string, options?: MathJaxConvertOptions, macros: MathJaxTeXMacros = {}): HTMLElement {
  const tex = new TeX({packages: AllPackages, macros})
  const tex_to_svg = mathjax.document("", {InputJax: tex, OutputJax: svg_output()})
  return tex_to_svg.convert(formula, {...defaults, ...options})
}

export function ascii2svg(_formula: string): HTMLElement {
  // TODO:
  // const ascii = new AsciiMath({})
  // const ascii_to_svg = mathjax.document("", {InputJax: ascii, OutputJax: svg})
  // return ascii_to_svg.convert(formula, options)
  throw new Error("not implemented")
}

export function mathml2svg(formula: string): HTMLElement {
  const mathml = new MathML({})
  const mathml_to_svg = mathjax.document("", {InputJax: mathml, OutputJax: svg_output()})
  return mathml_to_svg.convert(formula, defaults)
}

export function find_tex(text: string): MathJaxProtoItem[] {
  const find_text = new FindTeX({
    processEnvironments: false,
    processEscapes: false,
    processRefs: false,
  })

  return find_text.findMath([text])
}
