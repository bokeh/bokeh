declare namespace MathJax {
  type ConvertOptions = {
    display?: boolean
    em?: number
    ex?: number
    containerWidth?: number
  }

  type TeXMacros = {[key: string]: string | [string, number]}

  function tex2svg(formula: string, options?: ConvertOptions, macros?: TeXMacros): HTMLElement
  function ascii2svg(_formula: string): HTMLElement
  function mathml2svg(formula: string): HTMLElement
}
