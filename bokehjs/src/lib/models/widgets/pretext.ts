import {Markup, MarkupView} from "./markup"
import {pre} from "core/dom"

export class PreTextView extends MarkupView {
  model: PreText

  render(): void {
    super.render()
    const content = pre({style: {overflow: "auto"}}, this.model.text)
    this.markupEl.appendChild(content)
  }
}

export namespace PreText {
  export interface Attrs extends Markup.Attrs {}

  export interface Props extends Markup.Props {}
}

export interface PreText extends PreText.Attrs {}

export class PreText extends Markup {

  properties: PreText.Props

  constructor(attrs?: Partial<PreText.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PreText"
    this.prototype.default_view = PreTextView
  }
}

PreText.initClass()
