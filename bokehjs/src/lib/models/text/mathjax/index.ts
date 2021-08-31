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

const tex = new TeX({packages: AllPackages})
// const ascii = new AsciiMath({})
const mathml = new MathML({})

const svg = new SVG({fontCache: "local"})

const tex_to_svg = mathjax.document("", {InputJax: tex, OutputJax: svg})
// const ascii_to_svg = mathjax.document("", {InputJax: ascii, OutputJax: svg})
const mathml_to_svg = mathjax.document("", {InputJax: mathml, OutputJax: svg})

const options = {
  display: true,
  em: 16,
  ex: 8,
  containerWidth: 80*16,
}

export function tex2svg(formula: string): HTMLElement {
  return tex_to_svg.convert(formula, options)
}

export function ascii2svg(_formula: string): HTMLElement {
  // TODO: return ascii_to_svg.convert(formula, options)
  throw new Error("not implemented")
}

export function mathml2svg(formula: string): HTMLElement {
  return mathml_to_svg.convert(formula, options)
}
