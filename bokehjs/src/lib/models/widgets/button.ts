import {AbstractButton, AbstractButtonView} from "./abstract_button"
import {ButtonClick} from "core/bokeh_events"

import * as p from "core/properties"

export class ButtonView extends AbstractButtonView {
  override model: Button

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
  override properties: Button.Props
  override __view_type__: ButtonView

  constructor(attrs?: Partial<Button.Attrs>) {
    super(attrs)
  }

  static init_Button(): void {
    this.prototype.default_view = ButtonView

    this.override<Button.Props>({
      label: "Button",
    })
  }
}
