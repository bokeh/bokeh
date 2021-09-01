declare namespace MathJax {
  type TeXMacros = {[key: string]: string | [string, number]}

  function tex2svg(input: string, macros?: TeXMacros): HTMLElement
  function ascii2svg(input: string): HTMLElement
  function mathml2svg(input: string): HTMLElement
}
