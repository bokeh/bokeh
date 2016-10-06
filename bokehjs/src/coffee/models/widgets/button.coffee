import * as _ from "underscore"

import * as p from "../../core/properties"

import * as AbstractButton from "./abstract_button"


class ButtonView extends AbstractButton.View

  change_input: () ->
    @model.clicks = @model.clicks + 1
    super()


class Button extends AbstractButton.Model
  type: "Button"
  default_view: ButtonView

  @define {
    clicks: [ p.Number, 0        ]
  }

export {
  Button as Model
  ButtonView as View
}
