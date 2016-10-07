import * as $ from "jquery"

import {Markup, MarkupView} from "./markup"
import * as p from "../../core/properties"

export class DivView extends MarkupView

  render: () ->
    super()
    if @model.render_as_text == true
      $content = $('<div></div>').text(@model.text)
    else
      $content = $('<div></div>').html(@model.text)
    @$el.find('.bk-markup').append($content)
    return @

export class Div extends Markup
  type: "Div"
  default_view: DivView

  @define {
    render_as_text: [ p.Bool,   false]
  }
