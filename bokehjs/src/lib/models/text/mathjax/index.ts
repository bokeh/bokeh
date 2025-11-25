import {mathjax} from "@mathjax/src/ts/mathjax"
import type {Metrics, ProtoItem} from "@mathjax/src/ts/core/MathItem"
import {TeX} from "@mathjax/src/ts/input/tex"
import {MathML} from "@mathjax/src/ts/input/mathml"
import {AsciiMath} from "@mathjax/src/ts/input/asciimath"
import {SVG} from "@mathjax/src/ts/output/svg"
import {browserAdaptor} from "@mathjax/src/ts/adaptors/browserAdaptor"
import {RegisterHTMLHandler} from "@mathjax/src/ts/handlers/html"
import {AllPackages} from "@mathjax/src/ts/input/tex/AllPackages"
import {FindTeX} from "@mathjax/src/ts/input/tex/FindTeX"

const adaptor = browserAdaptor()
RegisterHTMLHandler(adaptor)

const svg = new SVG({fontCache: "local"})

const defaults: Metrics = {
  display: true,
  em: 16,
  ex: 8,
  containerWidth: 80*16,
}

export function tex2svg(formula: string, options?: MathJax.ConvertOptions, macros: MathJax.TeXMacros = {}): HTMLElement {
  const tex = new TeX({packages: AllPackages, macros})
  const tex_to_svg = mathjax.document("", {InputJax: tex, OutputJax: svg})
  return tex_to_svg.convert(formula, {...defaults, ...options})
}

export function ascii2svg(_formula: string): HTMLElement {
  const ascii = new AsciiMath({})
  ascii
  // TODO:
  // const ascii_to_svg = mathjax.document("", {InputJax: ascii, OutputJax: svg})
  // return ascii_to_svg.convert(formula, options)
  throw new Error("not implemented")
}

export function mathml2svg(formula: string): HTMLElement {
  const mathml = new MathML({})
  const mathml_to_svg = mathjax.document("", {InputJax: mathml, OutputJax: svg})
  return mathml_to_svg.convert(formula, defaults)
}

export function find_tex(text: string): ProtoItem<unknown, unknown>[] {
  const find_text = new FindTeX({
    processEnvironments: false,
    processEscapes: false,
    processRefs: false,
  })

  return find_text.findMath([text])
}
