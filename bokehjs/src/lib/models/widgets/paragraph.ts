import {Markup, MarkupView} from "./markup"
import {p as paragraph} from "core/dom"
import * as p from "core/properties"
import {TeXBox} from "core/math_graphics"

export class ParagraphView extends MarkupView {
  override model: Paragraph

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await new TeXBox(this.model).load_provider()
  }

  override async render(): Promise<void> {
    super.render()
    // This overrides default user-agent styling and helps layout work
    const content = paragraph({style: {margin: 0}})
    const math_graphics = new TeXBox(this.model)

    if (this.model.disable_math ||!math_graphics.contains_tex())
      content.textContent = this.model.text
    else
      this.markup_el.innerHTML = math_graphics.to_html_string()

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
