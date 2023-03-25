declare namespace MathJax {
  type ConvertOptions = {
    display?: boolean
    em?: number
    ex?: number
    containerWidth?: number
  }

  type TeXMacros = {[key: string]: string | [string, number]}

  type ProtoItem = {
    math: string             // The math expression itself
    start: {n?: number}      // The starting location of the math
    end: {n?: number}        // The ending location of the math
    open?: string            // The opening delimiter
    close?: string           // The closing delimiter
    n?: number               // The index of the string in which this math is found
    display: boolean         // True means display mode, false is inline mode
  }

  function tex2svg(formula: string, options?: ConvertOptions, macros?: TeXMacros): HTMLElement
  function ascii2svg(_formula: string, options?: ConvertOptions): HTMLElement
  function mathml2svg(formula: string, options?: ConvertOptions): HTMLElement
  function find_tex(text: string): ProtoItem[]
}
