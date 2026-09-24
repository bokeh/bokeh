export type MathJaxConvertOptions = {
  display?: boolean
  em?: number
  ex?: number
  containerWidth?: number
}

export type MathJaxTeXMacros = {[key: string]: string | [string, number]}

export type MathJaxProtoItem = {
  math: string
  start: {n?: number}
  end: {n?: number}
  open?: string
  close?: string
  n?: number
  display: boolean
}

export type MathJaxAPI = {
  tex2svg(formula: string, options?: MathJaxConvertOptions, macros?: MathJaxTeXMacros): HTMLElement
  ascii2svg(formula: string, options?: MathJaxConvertOptions): HTMLElement
  mathml2svg(formula: string, options?: MathJaxConvertOptions): HTMLElement
  find_tex(text: string): MathJaxProtoItem[]
}

declare global {
  const MathJax: MathJaxAPI
}
