/* XXX: partial */
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

export class Div extends Markup {

  static initClass() {
    this.prototype.type = "Div"
    this.prototype.default_view = DivView

    this.define({
      render_as_text: [ p.Bool,   false]
    })
  }
}

Div.initClass()
