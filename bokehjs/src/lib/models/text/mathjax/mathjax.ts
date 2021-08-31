import {mathjax} from "mathjax-full/js/mathjax.js"
import {TeX} from "mathjax-full/js/input/tex.js"
import {SVG} from "mathjax-full/js/output/svg.js"
import {browserAdaptor} from "mathjax-full/js/adaptors/browserAdaptor"
import {RegisterHTMLHandler} from "mathjax-full/js/handlers/html.js"
import {AllPackages} from "mathjax-full/js/input/tex/AllPackages.js"

const adaptor = browserAdaptor()
RegisterHTMLHandler(adaptor)

const tex = new TeX({packages: AllPackages})
const svg = new SVG({fontCache: "local"})
const html = mathjax.document("", {InputJax: tex, OutputJax: svg})

export function tex2svg(formula: string): HTMLElement {
  return html.convert(formula, {
    display: true,
    em: 16,
    ex: 8,
    containerWidth: 80 * 16,
  })
}

export default {
  tex2svg,
}
