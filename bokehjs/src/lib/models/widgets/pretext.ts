import {Markup, MarkupView} from "./markup"
import {pre} from "core/dom"
import * as p from "core/properties"

export class PreTextView extends MarkupView {
  model: PreText

  render(): void {
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
  properties: PreText.Props

  constructor(attrs?: Partial<PreText.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = PreTextView
  }
}
PreText.initClass()
