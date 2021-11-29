import {Markup, MarkupView} from "./markup"
import {p as paragraph} from "core/dom"
import * as p from "core/properties"
import { contains_tex, tex2html } from "models/text/html_math_text"
import { load_mathjax } from "models/text/html_math_text"

export class ParagraphView extends MarkupView {
  override model: Paragraph

  override async lazy_initialize() {
    await super.lazy_initialize()
    await load_mathjax()
  }

  override render(): void {
    super.render()
    // This overrides default user-agent styling and helps layout work
    const content = paragraph({style: {margin: 0}})

    if (this.model.disable_math || !contains_tex(this.model.text))
      content.textContent = this.model.text
    else
      content.innerHTML = tex2html(this.model.text)

    this.markup_el.appendChild(content)
  }
}

export namespace Paragraph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface Paragraph extends Paragraph.Attrs {}

export class Paragraph extends Markup {
  override properties: Paragraph.Props
  override __view_type__: ParagraphView

  constructor(attrs?: Partial<Paragraph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ParagraphView
  }
}
