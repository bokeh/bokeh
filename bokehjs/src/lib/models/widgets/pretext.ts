import {Markup, MarkupView} from "./markup"
import {pre} from "core/dom"
import * as p from "core/properties"

export class PreTextView extends MarkupView {
  override model: PreText

  override render(): void {
    super.render()

    let content: HTMLPreElement

    if (this.has_math_disabled())
      content = pre({style: {overflow: "auto"}}, this.model.text)
    else {
      content = pre({style: {overflow: "auto"}})
      content.innerHTML = this.process_tex()
    }

    this.markup_el.appendChild(content)
  }
}

export namespace PreText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface PreText extends PreText.Attrs {}

export class PreText extends Markup {
  override properties: PreText.Props
  override __view_type__: PreTextView

  constructor(attrs?: Partial<PreText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PreTextView
  }
}
