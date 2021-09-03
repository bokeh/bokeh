import {mathjax} from "mathjax-full/js/mathjax.js"
import {TeX} from "mathjax-full/js/input/tex.js"
import {MathML} from "mathjax-full/js/input/mathml"
// import {AsciiMath} from "mathjax-full/js/input/asciimath"
import {SVG} from "mathjax-full/js/output/svg.js"
import {browserAdaptor} from "mathjax-full/js/adaptors/browserAdaptor"
import {RegisterHTMLHandler} from "mathjax-full/js/handlers/html.js"
import {AllPackages} from "mathjax-full/js/input/tex/AllPackages.js"

const adaptor = browserAdaptor()
RegisterHTMLHandler(adaptor)

const svg = new SVG({fontCache: "local"})

const options = {
  display: true,
  em: 16,
  ex: 8,
  containerWidth: 80*16,
}

type TeXMacros = {[key: string]: string | [string, number]}

export function tex2svg(formula: string, macros: TeXMacros = {}): HTMLElement {
  const tex = new TeX({packages: AllPackages, macros})
  const tex_to_svg = mathjax.document("", {InputJax: tex, OutputJax: svg})
  return tex_to_svg.convert(formula, options)
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
  const mathml_to_svg = mathjax.document("", {InputJax: mathml, OutputJax: svg})
  return mathml_to_svg.convert(formula, options)
}
