import {Markup, MarkupView} from "./markup"
import {p} from "core/dom"

export class ParagraphView extends MarkupView

  render: () ->
    super()
    # This overrides default user-agent styling and helps layout work
    content = p({style: {margin: 0}}, @model.text)
    @$el.find('.bk-markup').append(content)

export class Paragraph extends Markup
  type: "Paragraph"
  default_view: ParagraphView
