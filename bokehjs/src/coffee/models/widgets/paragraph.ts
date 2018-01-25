/* XXX: partial */
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

export namespace Paragraph {
  export interface Attrs extends Markup.Attrs {}
}

export interface Paragraph extends Markup, Paragraph.Attrs {}

export class Paragraph extends Markup {

  static initClass() {
    this.prototype.type = "Paragraph"
    this.prototype.default_view = ParagraphView
  }
}

Paragraph.initClass()
