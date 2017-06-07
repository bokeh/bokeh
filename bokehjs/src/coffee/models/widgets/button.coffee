import * as p from "core/properties"
import {register_with_event, ButtonClick} from "core/bokeh_events"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class ButtonView extends AbstractButtonView

  change_input: () ->
    @model.click()

export class Button extends AbstractButton
  type: "Button"
  default_view: ButtonView

  @define {
    clicks: [ p.Number, 0 ]
  }

  click: () ->
    if not @disabled
      @trigger_event(new ButtonClick({}))
      @clicks += 1

register_with_event(ButtonClick, Button)
