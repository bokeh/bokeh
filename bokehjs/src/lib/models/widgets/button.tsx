import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {ButtonClick} from "core/bokeh_events"
import type {EventCallback} from "model"

import type * as p from "core/properties"

export class ButtonView extends AbstractButtonView {
  declare model: Button

  override click(): void {
    this.model.trigger_event(new ButtonClick())
    super.click()
  }
}

export namespace Button {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractButton.Props
}

export interface Button extends Button.Attrs {}

export class Button extends AbstractButton {
  declare properties: Button.Props
  declare __view_type__: ButtonView

  constructor(attrs?: Partial<Button.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ButtonView

    this.override<Button.Props>({
      label: "Button",
    })
  }

  on_click(callback: EventCallback<ButtonClick>): void {
    this.on_event(ButtonClick, callback)
  }
}
