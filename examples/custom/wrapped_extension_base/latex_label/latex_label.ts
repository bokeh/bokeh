import {Label, LabelView} from "@bokehjs/models/annotations/html/label"
import * as p from "@bokehjs/core/properties"

import css from "./styles/latex_label.css"

declare namespace katex {
  function render(expression: string, element: HTMLElement, options: {displayMode?: boolean}): void
}

export class LatexLabelView extends LabelView {
  override model: LatexLabel

  override styles(): string[] {
    return [...super.styles(), css]
  }

  protected override _render(): void {
    super._render()
    this.el.classList.add("label-style")
    katex.render(this.model.text, this.el, {displayMode: true})
  }
}

export namespace LatexLabel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Label.Props
}

export interface LatexLabel extends LatexLabel.Attrs {}

export class LatexLabel extends Label {
  override properties: LatexLabel.Props
  override __view_type__: LatexLabelView

  static override __module__ = "latex_label"

  static {
    this.prototype.default_view = LatexLabelView
  }
}
