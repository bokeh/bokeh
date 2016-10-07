import * as $ from "jquery"

import {Markup, MarkupView} from "./markup"

export class ParagraphView extends MarkupView

  render: () ->
    super()
    # This overrides default user-agent styling and helps layout work
    $para = $('<p style="margin: 0;"></p>').text(@model.text)
    @$el.find('.bk-markup').append($para)

export class Paragraph extends Markup
  type: "Paragraph"
  default_view: ParagraphView
