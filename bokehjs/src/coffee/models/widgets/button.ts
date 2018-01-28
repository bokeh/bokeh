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

export namespace Button {
  export interface Attrs extends AbstractButton.Attrs {
    clicks: number
  }

  export interface Opts extends AbstractButton.Opts {}
}

export interface Button extends Button.Attrs {}

export class Button extends AbstractButton {

  constructor(attrs?: Partial<Button.Attrs>, opts?: Button.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "Button"
    this.prototype.default_view = ButtonView

    this.define({
      clicks: [ p.Number, 0 ],
    })

    register_with_event(ButtonClick, this)
  }
}

Button.initClass()
