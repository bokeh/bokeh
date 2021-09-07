declare namespace MathJax {
  type TeXMacros = {[key: string]: string | [string, number]}

  type ConvertOptions = {
    display?: boolean
    em?: number
    ex?: number
    containerWidth?: number
  }

  function tex2svg(input: string, options?: ConvertOptions, macros?: TeXMacros): HTMLElement
  function ascii2svg(input: string): HTMLElement
  function mathml2svg(input: string): HTMLElement
}
