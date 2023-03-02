import {HTMLLabel, HTMLLabelView} from "@bokehjs/models/annotations/html/label"

import * as katex from "katex"

//"https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.js"
//"https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.10.0/katex.min.css"

export class LatexLabelView extends HTMLLabelView {
  declare model: LatexLabel

  protected override _render(): void {
    super._render()
    katex.render(this.model.text, this.el, {displayMode: true})
  }
}

export class LatexLabel extends HTMLLabel {
  static override __module__ = "latex_label"

  static {
    this.prototype.default_view = LatexLabelView
  }
}
