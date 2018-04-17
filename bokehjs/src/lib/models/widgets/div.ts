import {Markup, MarkupView} from "./markup"
import {div} from "core/dom"
import * as p from "core/properties"

export class DivView extends MarkupView {
  model: Div

  render(): void {
    super.render()
    const content = div()
    if (this.model.render_as_text)
      content.textContent = this.model.text
    else
      content.innerHTML = this.model.text
    this.markupEl.appendChild(content)
  }
}

export namespace Div {
  export interface Attrs extends Markup.Attrs {
    render_as_text: boolean
  }

  export interface Props extends Markup.Props {}
}

export interface Div extends Div.Attrs {}

export class Div extends Markup {

  properties: Div.Props

  constructor(attrs?: Partial<Div.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Div"
    this.prototype.default_view = DivView

    this.define({
      render_as_text: [ p.Bool,   false],
    })
  }
}

Div.initClass()
