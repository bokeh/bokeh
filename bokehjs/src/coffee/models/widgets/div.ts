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
}

Div.prototype.type = "Div"
Div.prototype.default_view = DivView

Div.define({
  render_as_text: [ p.Bool,   false]
})
