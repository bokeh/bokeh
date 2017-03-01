import {Markup, MarkupView} from "./markup"
import {pre} from "core/dom"
import * as p from "core/properties"

export class PreTextView extends MarkupView

  render: () ->
    super()
    content = pre({style: {overflow: "auto"}}, @model.text)
    @$el.find('.bk-markup').append(content)

export class PreText extends Markup
  type: "PreText"
  default_view: PreTextView
