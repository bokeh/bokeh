import * as $ from "jquery"

import * as Markup from "./markup"
import * as p from "../../core/properties"

class PreTextView extends Markup.View

  render: () ->
    super()
    $pre = $('<pre style="overflow: auto"></pre>').text(@model.text)
    @$el.find('.bk-markup').append($pre)

class PreText extends Markup.Model
  type: "PreText"
  default_view: PreTextView

export {
  PreText as Model
  PreTextView as View
}
