import * as p from "core/properties"
import {register_with_event, ButtonClick} from "core/bokeh_events"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class ButtonView extends AbstractButtonView

  change_input: () ->
    @model.trigger_event(new ButtonClick({}))
    @model.clicks = @model.clicks + 1
    super()

export class Button extends AbstractButton
  type: "Button"
  default_view: ButtonView

  @define {
    clicks: [ p.Number, 0 ]
  }

register_with_event(ButtonClick, Button)
