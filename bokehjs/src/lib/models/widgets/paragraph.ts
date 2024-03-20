import {Markup, MarkupView} from "./markup"
import {p as paragraph} from "core/dom"
import type * as p from "core/properties"

export class ParagraphView extends MarkupView {
  declare model: Paragraph

  override render(): void {
    super.render()
    // This overrides default user-agent styling and helps layout work
    const content = paragraph({style: {margin: "0px"}})

    if (this.has_math_disabled()) {
      content.textContent = this.model.text
    } else {
      content.innerHTML = this.process_tex(this.model.text)
    }

    this.markup_el.appendChild(content)
  }
}

export namespace Paragraph {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface Paragraph extends Paragraph.Attrs {}

export class Paragraph extends Markup {
  declare properties: Paragraph.Props
  declare __view_type__: ParagraphView

  constructor(attrs?: Partial<Paragraph.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ParagraphView
  }
}
