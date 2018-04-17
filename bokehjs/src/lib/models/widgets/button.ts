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

  export interface Props extends AbstractButton.Props {}
}

export interface Button extends Button.Attrs {}

export class Button extends AbstractButton {

  properties: Button.Props

  constructor(attrs?: Partial<Button.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Button"
    this.prototype.default_view = ButtonView

    this.define({
      clicks: [ p.Number, 0 ],
    })

    register_with_event(ButtonClick, this)
  }
}

Button.initClass()
