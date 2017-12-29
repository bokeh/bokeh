import {Markup, MarkupView} from "./markup"
import {div} from "core/dom"
import * as p from "core/properties"

export class DivView extends MarkupView

  render: () ->
    super()
    content = div()
    if @model.render_as_text
      content.textContent = @model.text
    else
      content.innerHTML = @model.text
    @markupEl.appendChild(content)
    return @

export class Div extends Markup
  type: "Div"
  default_view: DivView

  @define {
    render_as_text: [ p.Bool,   false]
  }
