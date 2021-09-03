declare namespace MathJax {
  type TeXMacros = {[key: string]: string | [string, number]}
  type MathJaxOptions = {
    format?: string
    /** a boolean specifying whether the math is in display-mode or not (for TeX input). Default is true. */
    display?: boolean
    end?: number
    /** a number giving the number of pixels in an ex for the surrounding font. Default is 8. */
    ex?: number
    /** a number giving the number of pixels in an em for the surrounding font. Default is 16. */
    em?: number
    /** a number giving the width of the container, in pixels. Default is 80 times the ex value. */
    containerWidth?: number
    /**  a number giving the line-breaking width in em units. Default is a very large number (100000), so effectively no line breaking. */
    lineWidth?: number
    svg?: {
      /** a number giving a scaling factor to apply to the resulting conversion. Default is 1. */
      scale?: number
      family?: string
      /** smallest scaling factor to use */
      minScale?: number
      /** true to make mtext elements use surrounding font */
      mtextInheritFont?: boolean
      /** true to make merror text use surrounding font */
      merrorInheritFont?: boolean
      /** font to use for mtext, if not inheriting (empty means use MathJax fonts) */
      mtextFont?: string
      /** font to use for merror, if not inheriting (empty means use MathJax fonts) */
      merrorFont?: string
      /** true for MathML spacing rules, false for TeX rules */
      mathmlSpacing?: boolean
      /** RFDa and other attributes NOT to copy to the output */
      skipAttributes?: {}
      /** default size of ex in em units */
      exFactor?: number
      /** default for indentalign when set to 'auto' */
      displayAlign?: string
      /** default for indentshift when set to 'auto' */
      displayIndent?: string
      /** The wrapper factory to use */
      wrapperFactory?: any
      /** The FontData object to use */
      font?: any
      /** The CssStyles object to use */
      cssStyles?: any
      /** insert <title> tags with speech content */
      internalSpeechTitles?: boolean
      /** initial id number to use for aria-labeledby titles */
      titleID?: number
      /** or 'global' or 'none' */
      fontCache?: "global" | "local"
      /** ID to use for local font cache (for single equation processing) */
      localID?: any
    }
  }

  function tex2svg(input: string, options?: MathJaxOptions, macros?: TeXMacros): HTMLElement
  function ascii2svg(input: string, options?: MathJaxOptions): HTMLElement
  function mathml2svg(input: string, options?: MathJaxOptions): HTMLElement
}
