import {Markup, MarkupView} from "./markup"
import {pre} from "core/dom"

export class PreTextView extends MarkupView

  render: () ->
    super()
    content = pre({style: {overflow: "auto"}}, @model.text)
    @markupEl.appendChild(content)

export class PreText extends Markup
  type: "PreText"
  default_view: PreTextView
