/* XXX: partial */
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

  static initClass() {
    this.prototype.type = "Button"
    this.prototype.default_view = ButtonView

    this.define({
      clicks: [ p.Number, 0 ]
    })

    register_with_event(ButtonClick, this)
  }

  clicks: number
}

Button.initClass()
