import * as $ from "jquery"

import {Markup, MarkupView} from "./markup"
import * as p from "../../core/properties"

export class PreTextView extends MarkupView

  render: () ->
    super()
    $pre = $('<pre style="overflow: auto"></pre>').text(@model.text)
    @$el.find('.bk-markup').append($pre)

export class PreText extends Markup
  type: "PreText"
  default_view: PreTextView
