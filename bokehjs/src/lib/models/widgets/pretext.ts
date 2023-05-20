import {Markup, MarkupView} from "./markup"
import {pre} from "core/dom"
import type * as p from "core/properties"

export class PreTextView extends MarkupView {
  declare model: PreText

  override render(): void {
    super.render()

    const content = pre({style: {overflow: "auto"}}, this.model.text)
    this.markup_el.appendChild(content)
  }
}

export namespace PreText {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Markup.Props
}

export interface PreText extends PreText.Attrs {}

export class PreText extends Markup {
  declare properties: PreText.Props
  declare __view_type__: PreTextView

  constructor(attrs?: Partial<PreText.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PreTextView
  }
}
