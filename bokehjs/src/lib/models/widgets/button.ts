import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {ButtonClick} from "core/bokeh_events"

export class ButtonView extends AbstractButtonView {
  model: Button

  click(): void {
    this.model.trigger_event(new ButtonClick())
    super.click()
  }
}

export namespace Button {
  export interface Attrs extends AbstractButton.Attrs {}

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

    this.override({
      label: "Button",
    })

    this.register(ButtonClick)
  }
}
Button.initClass()
