import * as p from "core/properties"
import {register_with_event, ButtonClick} from "core/bokeh_events"

import {AbstractButton, AbstractButtonView} from "./abstract_button"

export class ButtonView extends AbstractButtonView {
  model: Button

  change_input(): void {
    this.model.trigger_event(new ButtonClick({}))
    this.model.clicks = this.model.clicks + 1
    super.change_input()
  }
}

export class Button extends AbstractButton {
  clicks: number
}

Button.prototype.type = "Button"
Button.prototype.default_view = ButtonView

Button.define({
  clicks: [ p.Number, 0 ]
})

register_with_event(ButtonClick, Button)
