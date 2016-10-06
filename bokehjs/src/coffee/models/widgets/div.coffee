import * as $ from "jquery"

import * as Markup from "./markup"
import * as p from "../../core/properties"

class DivView extends Markup.View

  render: () ->
    super()
    if @model.render_as_text == true
      $content = $('<div></div>').text(@model.text)
    else
      $content = $('<div></div>').html(@model.text)
    @$el.find('.bk-markup').append($content)
    return @

class Div extends Markup.Model
  type: "Div"
  default_view: DivView

  @define {
    render_as_text: [ p.Bool,   false]
  }

module.exports =
  Model: Div
  View: DivView
