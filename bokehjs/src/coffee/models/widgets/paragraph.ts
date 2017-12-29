import {Markup, MarkupView} from "./markup"
import {p} from "core/dom"

export class ParagraphView extends MarkupView {
  model: Paragraph

  render(): void {
    super.render()
    // This overrides default user-agent styling and helps layout work
    const content = p({style: {margin: 0}}, this.model.text)
    this.markupEl.appendChild(content)
  }
}

export class Paragraph extends Markup {
}

Paragraph.prototype.type = "Paragraph"
Paragraph.prototype.default_view = ParagraphView
