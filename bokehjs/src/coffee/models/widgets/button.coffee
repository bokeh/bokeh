import * as p from "core/properties"

import {AbstractButton, AbstractButtonView} from "./abstract_button"


export class ButtonView extends AbstractButtonView

  change_input: () ->
    @model.clicks = @model.clicks + 1
    super()


export class Button extends AbstractButton
  type: "Button"
  default_view: ButtonView

  @define {
    clicks: [ p.Number, 0        ]
  }
